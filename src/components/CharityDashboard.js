import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CharityProfile from './CharityProfile';
import { ethers } from 'ethers'

const CharityDashboard = ({ userState, setUserState, onDisconnect }) => {
    const [isApproved, setIsApproved] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkApprovalStatus();
    }, []);

    const checkApprovalStatus = async () => {
        try {
            const approved = await userState.authManagerContract.isCharityApproved(userState.address);
            setIsApproved(approved);
        } catch (error) {
            console.error("Error checking charity approval status:", error);
        }
    };

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

            if (!isCharityRegistered) {
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
                        <div className="text-xl font-bold">Charity Dashboard</div>
                        <div className="flex items-center space-x-4">
                            <span className="mr-4">{userState.address.slice(0, 6)}...{userState.address.slice(-4)}</span>
                            {isApproved ? (
                                <span className="bg-green-500 text-white px-2 py-1 rounded">Approved</span>
                            ) : (
                                <span className="bg-yellow-500 text-white px-2 py-1 rounded">Pending Approval</span>
                            )}
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
                <CharityProfile userState={userState} />
                {!isApproved && (
                    <div className="mt-8 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                        <p className="font-bold">Pending Approval</p>
                        <p>Your charity is currently pending approval. Once approved, you'll be able to receive donations.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CharityDashboard;