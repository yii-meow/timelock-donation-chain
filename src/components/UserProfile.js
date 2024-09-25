import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';

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
            await tx.wait();
            await fetchUserProfile();
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
            await tx.wait();
            await fetchUserProfile();
            onStatusChange(false);
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
            await tx.wait();
            await fetchUserProfile();
            onStatusChange(true);
            alert("Your account has been reactivated.");
        } catch (error) {
            console.error("Failed to reactivate user:", error);
            setError("Failed to reactivate account. Please try again later.");
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
        <div className="bg-white rounded-lg p-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-blue-600">User Profile</h2>
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center mb-2">
                    <User className="text-blue-500 mr-2" />
                    <p className="text-gray-600 font-semibold">Wallet Address:</p>
                </div>
                <p className="text-sm break-all">{userState.address}</p>
            </div>
            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={editedProfile.name}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={editedProfile.email}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex justify-between">
                        <button type="submit" className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Save className="mr-2" /> Save Changes
                        </button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <X className="mr-2" /> Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <User className="text-blue-500 mr-2" />
                            <p className="text-gray-600">Name:</p>
                            <p className="font-semibold ml-2">{userProfile.name}</p>
                        </div>
                        <div className="flex items-center">
                            <Mail className="text-blue-500 mr-2" />
                            <p className="text-gray-600">Email:</p>
                            <p className="font-semibold ml-2">{userProfile.email}</p>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="text-blue-500 mr-2" />
                            <p className="text-gray-600">Registration Date:</p>
                            <p className="font-semibold ml-2">{userProfile.registrationDate.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center">
                            <Shield className="text-blue-500 mr-2" />
                            <p className="text-gray-600">Account Status:</p>
                            <p className={`font-semibold ml-2 ${userProfile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                {userProfile.isActive ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between">
                        <button onClick={handleEditClick} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Edit className="mr-2" /> Edit Profile
                        </button>
                        {userProfile.isActive ? (
                            <button onClick={handleDeactivate} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <Shield className="mr-2" /> Deactivate Account
                            </button>
                        ) : (
                            <button onClick={handleReactivate} className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                <Shield className="mr-2" /> Reactivate Account
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfile;