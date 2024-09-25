import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const AdminDashboard = ({ authManagerContract, adminAddress }) => {
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCharities();
    }, []);

    const fetchCharities = async () => {
        try {
            setLoading(true);
            const charityAddresses = await authManagerContract.getAllCharities();
            const charityDetails = await Promise.all(
                charityAddresses.map(async (address) => {
                    const details = await authManagerContract.getCharityDetails(address);
                    return {
                        address,
                        name: details.name,
                        description: details.description,
                        isApproved: details.isApproved,
                        isActive: details.isActive,
                        category: details.category,
                        tags: details.tags
                    };
                })
            );
            setCharities(charityDetails);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching charities:", error);
            setError("Failed to fetch charities. Please try again.");
            setLoading(false);
        }
    };

    const handleApproval = async (charityAddress, approve) => {
        try {
            setLoading(true);
            if (approve) {
                await authManagerContract.approveCharity(charityAddress);
            } else {
                // Assuming there's a disapproveCharity function in the contract
                // If not, you might need to implement this in the smart contract
                await authManagerContract.disapproveCharity(charityAddress);
            }
            await fetchCharities(); // Refresh the list after approval/disapproval
        } catch (error) {
            console.error(`Error ${approve ? 'approving' : 'disapproving'} charity:`, error);
            setError(`Failed to ${approve ? 'approve' : 'disapprove'} charity. Please try again.`);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center">Loading charities...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="space-y-6">
                {charities.map((charity) => (
                    <div key={charity.address} className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-2">{charity.name}</h2>
                        <p className="text-gray-600 mb-2">{charity.description}</p>
                        <p className="mb-2"><strong>Address:</strong> {charity.address}</p>
                        <p className="mb-2"><strong>Category:</strong> {charity.category}</p>
                        <p className="mb-2"><strong>Tags:</strong> {charity.tags.join(', ')}</p>
                        <p className="mb-2"><strong>Status:</strong> {charity.isApproved ? 'Approved' : 'Not Approved'}</p>
                        <p className="mb-4"><strong>Active:</strong> {charity.isActive ? 'Yes' : 'No'}</p>
                        {charity.isApproved ? (
                            <button
                                onClick={() => handleApproval(charity.address, false)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Disapprove
                            </button>
                        ) : (
                            <button
                                onClick={() => handleApproval(charity.address, true)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Approve
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;