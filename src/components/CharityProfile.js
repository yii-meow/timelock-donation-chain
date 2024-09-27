import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { User, Mail, Calendar, Shield, Edit, Save, X, Tag, Briefcase, Hash, AlertTriangle } from 'lucide-react';

const CharityProfile = ({ userState }) => {
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
        if (userState.authManagerContract && userState.address) {
            fetchCharityDetails();
            fetchCategories();
        } else {
            setError("Contract or address not available. Please ensure you're connected.");
            setIsLoading(false);
        }
    }, [userState.authManagerContract, userState.address]);

    const fetchCharityDetails = async () => {
        setIsLoading(true);
        setError('');
        try {
            const details = await userState.authManagerContract.getCharityDetails(userState.address);
            const categoryName = await userState.authManagerContract.getCategoryName(details.category);
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
            const categoryCount = await userState.authManagerContract.getCategoryCount();
            const fetchedCategories = [];
            for (let i = 0; i < categoryCount; i++) {
                const categoryName = await userState.authManagerContract.getCategoryName(i);
                fetchedCategories.push({ id: i, name: categoryName });
            }
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleEditClick = () => setIsEditing(true);
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
            const transaction = await userState.authManagerContract.updateCharityDetails(
                editedDetails.name,
                editedDetails.description,
                editedDetails.category,
                tagArray
            );
            setCharityDetails(prev => ({
                ...prev,
                name: editedDetails.name,
                description: editedDetails.description,
                category: categories[editedDetails.category].name,
                tags: tagArray
            }));
            setIsEditing(false);
            await transaction.wait();
            await fetchCharityDetails();
            alert("Charity information updated successfully!");
        } catch (error) {
            console.error("Failed to update charity details:", error.data?.data?.reason || error.message);
            setError(`Failed to update charity details. ${error.data?.data?.reason || error.message}. Please try again later.`);
            setTimeout(() => window.location.reload(), 2000);
        } finally {
            setIsLoading(false);
            setTransactionPending(false);
        }
    };

    const handleToggleActivation = async () => {
        setIsLoading(true);
        setError('');
        try {
            const tx = await userState.authManagerContract.toggleCharityActivation();
            await tx.wait();
            setCharityDetails(prev => ({ ...prev, isActive: !prev.isActive }));
            alert(charityDetails.isActive ? "Your charity account has been deactivated." : "Your charity account has been reactivated.");
            await fetchCharityDetails(); // Refresh the charity details
        } catch (error) {
            console.error("Failed to toggle charity activation:", error);
            setError("Failed to change charity account status. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setIsLoading(true);
        setError('');
        try {
            await userState.authManagerContract.deactivateCharity();
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
            await userState.authManagerContract.reactivateCharity();
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
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-blue-600">{charityDetails.name}</h2>
            {transactionPending && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-lg font-semibold mb-2 text-center">Transaction Pending</p>
                        <p className="text-gray-600">Please wait while your transaction is being processed...</p>
                    </div>
                </div>
            )}
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Charity Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editedDetails.name}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={editedDetails.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={editedDetails.category}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={editedDetails.tags}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-600">{charityDetails.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                <Briefcase className="mr-2" size={20} /> Category
                            </h3>
                            <p className="text-gray-600">{charityDetails.category}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                <Tag className="mr-2" size={20} /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {charityDetails.tags.map((tag, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                            <User className="mr-2" size={20} /> Wallet Address
                        </h3>
                        <p className="font-mono text-sm bg-gray-100 p-2 rounded">{charityDetails.walletAddress}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                <Calendar className="mr-2" size={20} /> Registration Date
                            </h3>
                            <p className="text-gray-600">{charityDetails.registrationDate}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                <Shield className="mr-2" size={20} /> Approval Status
                            </h3>
                            <p className={`font-semibold ${charityDetails.isApproved ? "text-green-600" : "text-yellow-600"}`}>
                                {charityDetails.isApproved ? "Approved" : "Pending Approval"}
                            </p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                            <AlertTriangle className="mr-2" size={20} /> Account Status
                        </h3>
                        <p className={`font-semibold ${charityDetails.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {charityDetails.isActive ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    {!isEditing && (
                        <div className="flex justify-between pt-4 border-t">
                            <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">
                                Edit Profile
                            </button>
                            <button
                                onClick={handleToggleActivation}
                                className={`${charityDetails.isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded-md transition duration-300`}
                            >
                                {charityDetails.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CharityProfile;