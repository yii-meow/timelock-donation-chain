import React, { useState, useEffect } from 'react';

const Dashboard = ({ address, userAuthContract, onDisconnect }) => {
    const [userProfile, setUserProfile] = useState({ name: '', email: '' });
    const [editedProfile, setEditedProfile] = useState({ name: '', email: '' });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const profile = await userAuthContract.getUserDetails();
            setUserProfile({ name: profile.name, email: profile.email });
            setEditedProfile({ name: profile.name, email: profile.email });
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-indigo-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">User Dashboard</div>
                        <button onClick={onDisconnect} className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded">
                            Disconnect
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">User Profile</h2>
                    <p className="mb-4"><strong>Address:</strong> {address}</p>
                    <div>
                        <p><strong>Name:</strong> {userProfile.name}</p>
                        <p><strong>Email:</strong> {userProfile.email}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;