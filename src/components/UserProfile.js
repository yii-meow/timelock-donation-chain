import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const UserProfile = ({ address, authManagerContract }) => {
    const [userProfile, setUserProfile] = useState({ name: '', email: '', registrationDate: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        setIsLoading(true);
        setError('');
        try {
            const profile = await authManagerContract.getUserDetails();
            const registrationDate = new Date(profile.registrationDate.toNumber() * 1000);
            setUserProfile({
                name: profile.name,
                email: profile.email,
                registrationDate: registrationDate
            });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setError("Failed to load user profile. Please try again later.");
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
                <p className="font-semibold">{address}</p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Name:</p>
                <p className="font-semibold">{userProfile.name}</p>
            </div>
            <div className="mb-4">
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold">{userProfile.email}</p>
            </div>
            <div>
                <p className="text-gray-600">Registration Date:</p>
                <p className="font-semibold">{userProfile.registrationDate.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default UserProfile;