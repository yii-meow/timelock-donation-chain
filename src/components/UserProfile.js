import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const UserProfile = ({ userState, onStatusChange }) => {
    const [userProfile, setUserProfile] = useState({ name: '', email: '', registrationDate: '', isActive: true });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchUserProfile();
    }, [userState.authManagerContract]);

    const fetchUserProfile = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (!userState.authManagerContract) {
                throw new Error("Auth manager contract is not initialized");
            }
            const profile = await userState.authManagerContract.getUserDetails();
            const registrationDate = new Date(profile.registrationDate.toNumber() * 1000);
            setUserProfile({
                name: profile.name,
                email: profile.email,
                registrationDate: registrationDate,
                isActive: profile.isActive
            });
            setEditedProfile({ name: profile.name, email: profile.email });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setError(`Failed to load user profile: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedProfile({ name: userProfile.name, email: userProfile.email });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const tx = await userState.authManagerContract.updateUserDetails(editedProfile.name, editedProfile.email);
            await tx.wait(); // Wait for the transaction to be mined
            await fetchUserProfile(); // Fetch the updated profile from the blockchain
            setIsEditing(false);
            alert("Successfully updated user profile!");
        } catch (error) {
            console.error("Failed to update user profile:", error);
            setError("Failed to update profile. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const tx = await userState.authManagerContract.deactivateUser();
            await tx.wait(); // Wait for the transaction to be mined
            await fetchUserProfile(); // Fetch the updated profile from the blockchain
            alert("Your account has been deactivated.");
        } catch (error) {
            console.error("Failed to deactivate user:", error);
            setError("Failed to deactivate account. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactivate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const tx = await userState.authManagerContract.reactivateUser();
            await tx.wait(); // Wait for the transaction to be mined
            await fetchUserProfile(); // Fetch the updated profile from the blockchain
            alert("Your account has been reactivated.");
        } catch (error) {
            console.error("Failed to reactivate user:", error);
            setError("Failed to reactivate account. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center">Loading profile...</div>;
    }

    if (error) {
        return <div className="text-red-500 text-center">{error}</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">User Profile</h2>
            <div className="mb-4">
                <p className="text-gray-600">Wallet Address:</p>
                <p className="font-semibold">{userState.address}</p>
            </div>
            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-600">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editedProfile.name}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-600">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={editedProfile.email}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded"
                            required
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
                        <p className="text-gray-600">Name:</p>
                        <p className="font-semibold">{userProfile.name}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Email:</p>
                        <p className="font-semibold">{userProfile.email}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Registration Date:</p>
                        <p className="font-semibold">{userProfile.registrationDate.toLocaleString()}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-600">Account Status:</p>
                        <p className={`font-semibold ${userProfile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {userProfile.isActive ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    <div className="flex justify-between">
                        <button onClick={handleEditClick} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Edit Profile
                        </button>
                        {userProfile.isActive ? (
                            <button onClick={handleDeactivate} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                                Deactivate Account
                            </button>
                        ) : (
                            <button onClick={handleReactivate} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                                Reactivate Account
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfile;