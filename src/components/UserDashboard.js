import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserProfile from './UserProfile';
import CharityList from './CharityList';
import DonationForm from './DonationForm';
import TransactionManager from './TransactionManager';
import { ethers } from 'ethers';
import { User, Heart, DollarSign, List, MessageSquare, LogOut } from 'lucide-react';

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
            onDisconnect();
        } else if (accounts[0] !== userState.address) {
            await selectAddress(accounts[0]);
        }
    };

    const selectAddress = async (selectedAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner(selectedAddress);
            const authManagerContract = new ethers.Contract(userState.authManagerContract.address, userState.authManagerContract.interface, signer);
            const timeLockContract = new ethers.Contract(userState.timeLockContract.address, userState.timeLockContract.interface, signer);

            const isUserRegistered = await authManagerContract.isUserRegistered(selectedAddress);
            const isCharityRegistered = await authManagerContract.isCharityRegistered(selectedAddress);
            const isAdmin = await authManagerContract.isAdmin(selectedAddress);
            const isSignatory = await timeLockContract.isSignatory(selectedAddress);

            setUserState({
                ...userState,
                address: selectedAddress,
                authManagerContract: authManagerContract,
                timeLockContract: timeLockContract,
                isUser: isUserRegistered,
                isCharity: isCharityRegistered,
                isAdmin: isAdmin,
                isSignatory: isSignatory
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
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <nav className="bg-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-2xl font-bold flex items-center">
                            <User className="mr-2" /> User Dashboard
                        </div>
                        <div className="flex space-x-2 items-center">
                            {[
                                { icon: <User />, label: 'Profile', tab: 'profile' },
                                { icon: <Heart />, label: 'Charities', tab: 'charities' },
                                { icon: <DollarSign />, label: 'Donate', tab: 'donate' },
                                { icon: <List />, label: 'Transactions', tab: 'transactions' },
                            ].map(({ icon, label, tab }) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center py-2 px-4 rounded transition duration-300 ${activeTab === tab
                                        ? 'bg-white text-blue-600'
                                        : 'hover:bg-blue-700'
                                        }`}
                                >
                                    {icon}
                                    <span className="ml-2 hidden md:inline">{label}</span>
                                </button>
                            ))}
                            <Link
                                to="/chat/allusers"
                                className="flex items-center py-2 px-4 rounded bg-green-500 hover:bg-green-600 transition duration-300"
                            >
                                <MessageSquare />
                                <span className="ml-2 hidden md:inline">Chat</span>
                            </Link>
                            <button
                                onClick={onDisconnect}
                                className="flex items-center py-2 px-4 rounded bg-red-500 hover:bg-red-600 transition duration-300"
                            >
                                <LogOut />
                                <span className="ml-2 hidden md:inline">Disconnect</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white shadow-lg rounded-lg p-6">
                    {activeTab === 'profile' && (
                        <UserProfile
                            userState={userState}
                            onStatusChange={(isActive) => {
                                setUserState(prevState => ({ ...prevState, isActive }));
                            }}
                        />
                    )}
                    {activeTab === 'charities' && <CharityList authManagerContract={userState.authManagerContract} />}
                    {activeTab === 'donate' && (
                        <DonationForm
                            address={userState.address}
                            authManagerContract={userState.authManagerContract}
                            timeLockContract={userState.timeLockContract}
                        />
                    )}
                    {activeTab === 'transactions' && (
                        <TransactionManager
                            timeLockContract={userState.timeLockContract}
                            userAddress={userState.address}
                            isSignatory={userState.isSignatory}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;