import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CharityList = ({ authManagerContract }) => {
    const [charities, setCharities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCharities();
    }, []);

    const fetchCharities = async () => {
        setIsLoading(true);
        setError('');
        try {
            // This is a placeholder. You'll need to implement a method in your smart contract
            // to return all registered charities.
            const charityAddresses = await authManagerContract.getAllCharities();
            const charityDetails = await Promise.all(
                charityAddresses.map(async (address) => {
                    const details = await authManagerContract.getCharityDetails(address);
                    return {
                        address,
                        name: details.name,
                        description: details.description,
                        isApproved: details.isApproved
                    };
                })
            );
            setCharities(charityDetails);
        } catch (error) {
            console.error("Failed to fetch charities:", error);
            setError("Failed to load charities. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center">Loading charities...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Registered Charities</h2>
            {charities.length === 0 ? (
                <p>No charities registered yet.</p>
            ) : (
                charities.map((charity) => (
                    <div key={charity.address} className="bg-white shadow-md rounded-lg p-4">
                        <h3 className="text-xl font-semibold mb-2">{charity.name}</h3>
                        <p className="text-gray-600 mb-2">{charity.description}</p>
                        <p className="text-sm">
                            Address: {charity.address}
                        </p>
                        <p className={`text-sm ${charity.isApproved ? 'text-green-500' : 'text-yellow-500'}`}>
                            Status: {charity.isApproved ? 'Approved' : 'Pending Approval'}
                        </p>
                    </div>
                ))
            )}
        </div>
    );
};

export default CharityList;