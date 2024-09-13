import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import CharityList from './CharityList';
import DonationForm from './DonationForm';

const UserDashboard = ({ address, authManagerContract, onDisconnect }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();

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
                                Charities
                            </button>
                            <button
                                onClick={() => setActiveTab('donate')}
                                className={`py-2 px-4 rounded ${activeTab === 'donate' ? 'bg-blue-700' : ''}`}
                            >
                                Donate
                            </button>
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
                {activeTab === 'profile' && <UserProfile address={address} authManagerContract={authManagerContract} />}
                {activeTab === 'charities' && <CharityList authManagerContract={authManagerContract} />}
                {activeTab === 'donate' && <DonationForm address={address} authManagerContract={authManagerContract} />}
            </main>
        </div>
    );
};

export default UserDashboard;