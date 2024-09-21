import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import CharityList from './CharityList';
import DonationForm from './DonationForm';

const UserDashboard = ({ address, authManagerContract, onDisconnect }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [isActive, setIsActive] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const userDetails = await authManagerContract.getUserDetails();
            setIsActive(userDetails.isActive);
        } catch (error) {
            console.error("Error checking user status:", error);
        }
    };

    const handleDisconnect = () => {
        onDisconnect();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">User Dashboard</div>
                        <div className="flex space-x-4 items-center">
                            {isActive ? (
                                <>
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`py-2 px-4 rounded ${activeTab === 'profile' ? 'bg-blue-700' : ''}`}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('charities')}
                                        className={`py-2 px-4 rounded ${activeTab === 'charities' ? 'bg-blue-700' : ''}`}
                                    >
                                        Charities List
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('donate')}
                                        className={`py-2 px-4 rounded ${activeTab === 'donate' ? 'bg-blue-700' : ''}`}
                                    >
                                        Donate
                                    </button>
                                </>
                            ) : (
                                <span className="text-red-300">Account Inactive</span>
                            )}
                            <button
                                onClick={handleDisconnect}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                {activeTab === 'profile' && (
                    <UserProfile
                        address={address}
                        authManagerContract={authManagerContract}
                        onStatusChange={(status) => setIsActive(status)}
                    />
                )}
                {isActive && activeTab === 'charities' && <CharityList authManagerContract={authManagerContract} />}
                {isActive && activeTab === 'donate' && <DonationForm address={address} authManagerContract={authManagerContract} />}
                {!isActive && activeTab !== 'profile' && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mt-4" role="alert">
                        <p className="font-bold">Account Inactive</p>
                        <p>Your account is currently inactive. Please reactivate your account to access all features.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserDashboard;