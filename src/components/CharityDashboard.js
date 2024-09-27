import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CharityProfile from './CharityProfile';
import { ethers } from 'ethers';
import { Heart, DollarSign, Users, AlertTriangle, LogOut, ChevronDown, ExternalLink, Clock } from 'lucide-react';

const CharityDashboard = ({ userState, setUserState, onDisconnect }) => {
    const [isApproved, setIsApproved] = useState(false);
    const [charityStats, setCharityStats] = useState({
        totalDonations: 0,
        donorsCount: 0,
        pendingDonations: 0,
        recentDonations: []
    });
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkApprovalStatus();
        fetchCharityStats();
    }, []);

    const checkApprovalStatus = async () => {
        try {
            const approved = await userState.authManagerContract.isCharityApproved(userState.address);
            setIsApproved(approved);
        } catch (error) {
            console.error("Error checking charity approval status:", error);
        }
    };

    const fetchCharityStats = async () => {
        try {
            const transactions = await userState.timeLockContract.getCharityTransactions(userState.address);

            let totalDonations = 0;
            let pendingDonations = 0;
            const donorsSet = new Set();
            const recentDonations = [];

            for (let i = 0; i < transactions.ids.length; i++) {
                const amount = parseFloat(ethers.utils.formatEther(transactions.amounts[i]));
                if (transactions.executed[i]) {
                    totalDonations += amount;
                } else {
                    pendingDonations += amount;
                }
                donorsSet.add(transactions.creators[i]);

                if (recentDonations.length < 5) {
                    recentDonations.push({
                        id: transactions.ids[i].toString(),
                        amount: amount,
                        donor: transactions.creators[i],
                        date: new Date(transactions.releaseTimes[i].toNumber() * 1000).toISOString().split('T')[0],
                        executed: transactions.executed[i]
                    });
                }
            }

            setCharityStats({
                totalDonations,
                donorsCount: donorsSet.size,
                pendingDonations,
                recentDonations
            });
        } catch (error) {
            console.error("Error fetching charity stats:", error);
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
                address: selectedAddress,
                authManagerContract: authManagerContract,
                isConnected: true,
                isUser: isUserRegistered,
                isCharity: isCharityRegistered,
                isAdmin: isAdmin,
                isSignatory: isSignatory
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
            <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-2xl font-bold flex items-center">
                            <Heart className="mr-2" /> Charity Dashboard
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 transition duration-300 rounded-full py-2 px-4"
                                >
                                    <span>{userState.address.slice(0, 6)}...{userState.address.slice(-4)}</span>
                                    <ChevronDown size={20} />
                                </button>
                                {showProfileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                        <button onClick={onDisconnect} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Disconnect</button>
                                    </div>
                                )}
                            </div>
                            {isApproved ? (
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Approved</span>
                            ) : (
                                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Pending Approval</span>
                            )}
                        </div>
                    </div>
                </div>
            </nav>


            <main className="container mx-auto px-4 py-8">

                {!isApproved && (
                    <div className="mb-8 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow" role="alert">
                        <div className="flex">
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" />
                            <div>
                                <p className="font-bold">Pending Approval</p>
                                <p>Your charity is currently pending approval. Once approved, you'll be able to receive donations.</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                        <DollarSign className="text-blue-500 mr-4" size={40} />
                        <div>
                            <p className="text-gray-500">Total Donations Received</p>
                            <p className="text-2xl font-bold">{charityStats.totalDonations.toFixed(4)} ETH</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                        <Users className="text-green-500 mr-4" size={40} />
                        <div>
                            <p className="text-gray-500">Total Donors</p>
                            <p className="text-2xl font-bold">{charityStats.donorsCount}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                        <Clock className="text-yellow-500 mr-4" size={40} />
                        <div>
                            <p className="text-gray-500">Pending Donations</p>
                            <p className="text-2xl font-bold">{charityStats.pendingDonations.toFixed(4)} ETH</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
                        <Heart className="text-red-500 mr-4" size={40} />
                        <div>
                            <p className="text-gray-500">Approval Status</p>
                            <p className="text-2xl font-bold">{isApproved ? 'Approved' : 'Pending'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Charity Profile</h2>
                        <CharityProfile userState={userState} />
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Recent Donations</h2>
                        {charityStats.recentDonations.map(donation => (
                            <div key={donation.id} className="flex justify-between items-center border-b py-3">
                                <div>
                                    <p className="font-semibold">{donation.donor.slice(0, 6)}...{donation.donor.slice(-4)}</p>
                                    <p className="text-sm text-gray-500">{donation.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${donation.executed ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {donation.amount.toFixed(4)} ETH
                                    </p>
                                    <p className={`text-sm ${donation.executed ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {donation.executed ? 'Received' : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <Link to="/donations" className="text-blue-500 hover:underline mt-4 inline-block">View all donations</Link>
                    </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Complete your charity profile</li>
                        <li>Share your charity page on social media</li>
                        <li>Set up donation goals for your campaigns</li>
                        <li>Engage with your donors through updates</li>
                    </ul>
                    <button className="mt-4 bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-100 transition duration-300">
                        Get Started
                    </button>
                </div>
            </main>
        </div>
    );
};

export default CharityDashboard;