import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Alluser from './alluser';

const DonationForm = ({ address, authManagerContract, timeLockContract }) => {
    const [charities, setCharities] = useState([]);
    const [selectedCharity, setSelectedCharity] = useState('');
    const [amount, setAmount] = useState('');
    const [isInstant, setIsInstant] = useState(true);
    const [releaseTime, setReleaseTime] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    useEffect(() => {
        fetchApprovedCharities();
    }, []);

    const fetchApprovedCharities = async () => {
        try {
            const allCharities = await authManagerContract.getAllCharities();
            console.log(allCharities);
            const approvedCharities = [];
            for (let charity of allCharities) {
                const isCharity = await authManagerContract.isCharityRegistered(charity);
                const isApproved = await authManagerContract.isCharityApproved(charity);
                if (isCharity && isApproved) {
                    const details = await authManagerContract.getCharityDetails(charity);
                    approvedCharities.push({ address: charity, name: details.name });
                }
            }
            setCharities(approvedCharities);
        } catch (error) {
            console.error("Failed to fetch approved charities:", error);
            setError("Failed to load charities. Please try again later.");
        }
    };

    const handleDonation = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!selectedCharity || !amount) {
                throw new Error("Please select a charity and enter an amount");
            }

            const amountInWei = ethers.utils.parseEther(amount);
            let tx;

            if (isInstant) {
                tx = await timeLockContract.queueInstantTransfer(selectedCharity, amountInWei);
            } else {
                const releaseTimeUnix = Math.floor(new Date(releaseTime).getTime() / 1000);
                tx = await timeLockContract.queueTransaction(selectedCharity, amountInWei, releaseTimeUnix);
            }

            const receipt = await tx.wait();
            const transactionId = receipt.events.find(e => e.event === "TransactionCreated").args.transactionId.toString();

            setSuccess(`Successfully queued ${isInstant ? 'instant' : 'scheduled'} donation of ${amount} ETH to the selected charity. Transaction ID: ${transactionId}`);
            setAmount('');
            setSelectedCharity('');
            setReleaseTime('');
        } catch (error) {
            console.error("Donation failed:", error);
            setError(error.message || "Donation failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
            <form onSubmit={handleDonation}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="charity">
                        Select Charity
                    </label>
                    <select
                        id="charity"
                        value={selectedCharity}
                        onChange={(e) => setSelectedCharity(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    >
                        <option value="">Select a charity</option>
                        {charities.map((charity) => (
                            <option key={charity.address} value={charity.address}>
                                {charity.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                        Amount (ETH)
                    </label>
                    <input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="0.00"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isInstant}
                            onChange={() => setIsInstant(!isInstant)}
                            className="mr-2"
                        />
                        <span className="text-gray-700 text-sm font-bold">Instant Transfer</span>
                    </label>
                </div>
                {!isInstant && (
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="releaseTime">
                            Release Time
                        </label>
                        <input
                            id="releaseTime"
                            type="datetime-local"
                            value={releaseTime}
                            onChange={(e) => setReleaseTime(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required={!isInstant}
                        />
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Queue Donation'}
                    </button>
                </div>
            </form>
            {error && <p className="mt-4 text-red-500">{error}</p>}
            {success && <p className="mt-4 text-green-500">{success}</p>}
        </div>
    );
};

export default DonationForm;