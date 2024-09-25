import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import CharityList from './CharityList';
import DonationForm from './DonationForm';
import { ethers } from 'ethers';

const UserDashboard = ({ userState, setUserState, onDisconnect }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            onDisconnect();
        } else if (accounts[0] !== userState.address) {
            // User has switched accounts
            await selectAddress(accounts[0]);
        }
    };

    const selectAddress = async (selectedAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner(selectedAddress);
            const authManagerContract = new ethers.Contract(userState.authManagerContract.address, userState.authManagerContract.interface, signer);

            const isUserRegistered = await authManagerContract.isUserRegistered(selectedAddress);
            const isCharityRegistered = await authManagerContract.isCharityRegistered(selectedAddress);

            setUserState({
                address: selectedAddress,
                authManagerContract: authManagerContract,
                isConnected: true,
                isUser: isUserRegistered,
                isCharity: isCharityRegistered,
            });

            if (!isUserRegistered) {
                navigate('/');
            }
        } catch (error) {
            console.error("An error occurred while selecting the address:", error);
            onDisconnect();
        }
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
                                Charities List
                            </button>
                            <button
                                onClick={() => setActiveTab('donate')}
                                className={`py-2 px-4 rounded ${activeTab === 'donate' ? 'bg-blue-700' : ''}`}
                            >
                                Donate
                            </button>
                            <Link
                                to="/chat/allusers"
                                className="py-2 px-4 rounded bg-green-500 hover:bg-green-600"
                            >
                                Chat
                            </Link>
                            <button
                                onClick={onDisconnect}
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
                        userState={userState}
                        onStatusChange={(isActive) => {
                            // You might want to update the global user state here
                        }}
                    />
                )}
                {activeTab === 'charities' && <CharityList authManagerContract={userState.authManagerContract} />}
                {activeTab === 'donate' && <DonationForm address={userState.address} authManagerContract={userState.authManagerContract} timeLockContract={userState.timeLockContract} />}
            </main>
        </div>
    );
};

export default UserDashboard;