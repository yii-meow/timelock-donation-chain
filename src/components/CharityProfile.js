import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CharityProfile = ({ address, authManagerContract }) => {
    const [charityDetails, setCharityDetails] = useState({
        name: '',
        description: '',
        walletAddress: '',
        registrationDate: '',
        isApproved: false,
        // totalDonationsReceived: ethers.BigNumber.from(0)
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCharityDetails();
    }, [address, authManagerContract]);

    const fetchCharityDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const details = await authManagerContract.getCharityDetails(address);
            console.log(authManagerContract)
            console.log(details)
            // const totalDonations = await authManagerContract.getCharityTotalDonations(address);

            setCharityDetails({
                name: details.name,
                description: details.description,
                walletAddress: details.walletAddress,
                registrationDate: new Date(details.registrationDate.toNumber() * 1000).toLocaleString(),
                isApproved: details.isApproved,
                // totalDonationsReceived: totalDonations
            });
        } catch (error) {
            if (error.reason) {
                setError(`Failed to load charity details: ${error.reason}`);
            } else if (error.data && error.data.message) {
                setError(`Failed to load charity details: ${error.data.message}`);
            } else {
                setError("Failed to load charity details. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center">Loading charity profile...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{charityDetails.name}</h2>
            <div className="mb-4">
                <p className="text-gray-600">Description:</p>
                <p>{charityDetails.description}</p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Wallet Address:</p>
                <p className="font-mono">{charityDetails.walletAddress}</p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Registration Date:</p>
                <p>{charityDetails.registrationDate}</p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Approval Status:</p>
                <p className={charityDetails.isApproved ? "text-green-500" : "text-yellow-500"}>
                    {charityDetails.isApproved ? "Approved" : "Pending Approval"}
                </p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Total Donations Received:</p>
                <p className="font-bold">{ethers.utils.formatEther(charityDetails.totalDonationsReceived)} ETH</p>
            </div>
            {charityDetails.isApproved && (
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Donate to this Charity
                </button>
            )}
        </div>
    );
};

export default CharityProfile;