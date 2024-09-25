import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { DollarSign, Calendar, Check, AlertCircle } from 'lucide-react';

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
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-blue-600 flex items-center">
                <DollarSign className="mr-2" />
                Make a Donation
            </h2>
            <form onSubmit={handleDonation} className="space-y-6">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="charity">
                        Select Charity
                    </label>
                    <select
                        id="charity"
                        value={selectedCharity}
                        onChange={(e) => setSelectedCharity(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                        Amount (ETH)
                    </label>
                    <div className="relative">
                        <input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                            placeholder="0.00"
                            required
                        />
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="instantTransfer"
                        checked={isInstant}
                        onChange={() => setIsInstant(!isInstant)}
                        className="mr-2"
                    />
                    <label htmlFor="instantTransfer" className="text-gray-700 text-sm font-bold">
                        Instant Transfer
                    </label>
                </div>
                {!isInstant && (
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="releaseTime">
                            Release Time
                        </label>
                        <div className="relative">
                            <input
                                id="releaseTime"
                                type="datetime-local"
                                value={releaseTime}
                                onChange={(e) => setReleaseTime(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                                required={!isInstant}
                            />
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        'Queue Donation'
                    )}
                </button>
            </form>
            {error && (
                <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}
            {success && (
                <div className="mt-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700" role="alert">
                    <p className="font-bold">Success</p>
                    <p>{success}</p>
                </div>
            )}
        </div>
    );
};

export default DonationForm;