import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CharityProfile = ({ address, authManagerContract }) => {
    const [charityDetails, setCharityDetails] = useState({
        name: '',
        description: '',
        walletAddress: '',
        registrationDate: '',
        isApproved: false,
        isActive: true,
        category: '',
        tags: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedDetails, setEditedDetails] = useState({
        name: '',
        description: '',
        category: 0,
        tags: ''
    });
    const [categories, setCategories] = useState([]);
    const [transactionPending, setTransactionPending] = useState(false);

    useEffect(() => {
        fetchCharityDetails();
        fetchCategories();
    }, [address, authManagerContract]);

    const fetchCharityDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const details = await authManagerContract.getCharityDetails(address);
            const categoryName = await authManagerContract.getCategoryName(details.category);
            const formattedDetails = {
                name: details.name,
                description: details.description,
                walletAddress: details.walletAddress,
                registrationDate: new Date(details.registrationDate.toNumber() * 1000).toLocaleString(),
                isApproved: details.isApproved,
                isActive: details.isActive,
                category: categoryName,
                tags: details.tags
            };
            setCharityDetails(formattedDetails);
            setEditedDetails({
                name: formattedDetails.name,
                description: formattedDetails.description,
                category: details.category,
                tags: formattedDetails.tags.join(', ')
            });
        } catch (error) {
            setError(`Failed to load charity details: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const categoryCount = await authManagerContract.getCategoryCount();
            const fetchedCategories = [];
            for (let i = 0; i < categoryCount; i++) {
                const categoryName = await authManagerContract.getCategoryName(i);
                fetchedCategories.push({ id: i, name: categoryName });
            }
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedDetails({
            name: charityDetails.name,
            description: charityDetails.description,
            category: categories.findIndex(cat => cat.name === charityDetails.category),
            tags: charityDetails.tags.join(', ')
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setTransactionPending(true);
        try {
            const tagArray = editedDetails.tags.split(',').map(tag => tag.trim());
            const transaction = await authManagerContract.updateCharityDetails(
                editedDetails.name,
                editedDetails.description,
                editedDetails.category,
                tagArray
            );
            // Update UI optimistically
            const optimisticUpdate = {
                ...charityDetails,
                name: editedDetails.name,
                description: editedDetails.description,
                category: categories[editedDetails.category].name,
                tags: tagArray
            };
            setCharityDetails(optimisticUpdate);
            setIsEditing(false);

            // Wait for transaction to be mined
            await transaction.wait();

            // Fetch the updated details from the blockchain
            await fetchCharityDetails();

            alert("Charity information updated successfully!");
        } catch (error) {
            console.error("Failed to update charity details:", error);
            setError("Failed to update charity details. Please try again later.");
        } finally {
            setIsLoading(false);
            setTransactionPending(false);
        }
    };

    const handleDeactivate = async () => {
        setIsLoading(true);
        setError('');
        try {
            await authManagerContract.deactivateCharity();
            setCharityDetails(prev => ({ ...prev, isActive: false }));
            alert("Your charity account has been deactivated.");
        } catch (error) {
            console.error("Failed to deactivate charity:", error);
            setError("Failed to deactivate charity account. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactivate = async () => {
        setIsLoading(true);
        setError('');
        try {
            await authManagerContract.reactivateCharity();
            setCharityDetails(prev => ({ ...prev, isActive: true }));
            alert("Your charity account has been reactivated.");
        } catch (error) {
            console.error("Failed to reactivate charity:", error);
            setError("Failed to reactivate charity account. Please try again later.");
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
            {transactionPending && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="bg-white p-5 rounded-md">
                        <p className="text-lg font-semibold mb-2">Transaction Pending</p>
                        <p>Please wait while your transaction for updating information is being processed...</p>
                    </div>
                </div>
            )}
            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-600">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editedDetails.name}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-600">Description:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={editedDetails.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            rows="4"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="category" className="block text-gray-600">Category:</label>
                        <select
                            id="category"
                            name="category"
                            value={editedDetails.category}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="tags" className="block text-gray-600">Tags (comma-separated):</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={editedDetails.tags}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="flex justify-between">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Save Changes
                        </button>
                        <button type="button" onClick={handleCancelEdit} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="mb-4">
                        <p className="text-gray-600">Description:</p>
                        <p>{charityDetails.description}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Category:</p>
                        <p className="font-semibold">{charityDetails.category}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                            {charityDetails.tags.map((tag, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
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
                            {charityDetails.isApproved ? "Approved" : "Pending Approval by Admin"}
                        </p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Account Status:</p>
                        <p className={`font-semibold ${charityDetails.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {charityDetails.isActive ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    <div className="flex justify-between">
                        <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Edit Profile
                        </button>
                        {charityDetails.isActive ? (
                            <button onClick={handleDeactivate} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                Deactivate Account
                            </button>
                        ) : (
                            <button onClick={handleReactivate} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Reactivate Account
                            </button>
                        )}
                    </div>
                    {charityDetails.isApproved && charityDetails.isActive && (
                        <button className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">
                            Accept Donations
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default CharityProfile;