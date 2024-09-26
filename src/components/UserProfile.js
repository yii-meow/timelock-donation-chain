import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { User, Mail, Calendar, Shield, Edit, Save, X, DollarSign, Award, Clock, ChevronRight } from 'lucide-react';

const UserProfile = ({ userState, onStatusChange }) => {
    const [userProfile, setUserProfile] = useState({ name: '', email: '', registrationDate: '', isActive: true });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchUserProfile();
    }, [userState.authManagerContract, userState.address]);

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

    const renderProfileCard = () => (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Profile Information</h3>
                <button onClick={handleEditClick} className="text-blue-500 hover:text-blue-700">
                    <Edit size={20} />
                </button>
            </div>
            <div className="space-y-3">
                <div className="flex items-center">
                    <User className="text-blue-500 mr-3" size={20} />
                    <p className="text-gray-600">Name:</p>
                    <p className="font-semibold ml-2">{userProfile.name}</p>
                </div>
                <div className="flex items-center">
                    <Mail className="text-blue-500 mr-3" size={20} />
                    <p className="text-gray-600">Email:</p>
                    <p className="font-semibold ml-2">{userProfile.email}</p>
                </div>
                <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-3" size={20} />
                    <p className="text-gray-600">Registered:</p>
                    <p className="font-semibold ml-2">{userProfile.registrationDate.toLocaleDateString()}</p>
                </div>
                <div className="flex items-center">
                    <Shield className="text-blue-500 mr-3" size={20} />
                    <p className="text-gray-600">Status:</p>
                    <p className={`font-semibold ml-2 ${userProfile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {userProfile.isActive ? 'Active' : 'Inactive'}
                    </p>
                </div>
            </div>
            <div className="flex justify-end">
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
        </div>
    );

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
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-4xl font-bold mb-8 text-gray-800">My Profile</h2>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Edit Profile</h3>
                    <div className="space-y-4">
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
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Save Changes
                        </button>
                    </div>
                </form>
            ) : (
                <>
                    {renderProfileCard()}
                    {/* Call to Action for Donations */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-center mt-10 text-white">
                        <h3 className="text-2xl font-bold mb-2">Make a Difference Today!</h3>
                        <p className="mb-4">Your donations help change lives around the world.</p>
                        <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-100 transition duration-300">
                            Donate Now
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfile;