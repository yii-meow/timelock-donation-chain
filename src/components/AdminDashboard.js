import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Briefcase, Tag, Check, X, AlertTriangle, Search, LogOut, Filter } from 'lucide-react';

const AdminDashboard = ({ authManagerContract, adminAddress, onDisconnect, setUserState, userState }) => {
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [categoryNames, setCategoryNames] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        fetchCharities();
        fetchCategories();
    }, []);

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

            if (!isAdmin) {
                navigate('/');
            }
        } catch (error) {
            console.error("An error occurred while selecting the address:", error);
            onDisconnect();
        }
    };

    const fetchCategories = async () => {
        try {
            const categoryCount = await authManagerContract.getCategoryCount();
            const categories = {};
            for (let i = 0; i < categoryCount; i++) {
                const categoryName = await authManagerContract.getCategoryName(i);
                categories[i] = categoryName;
            }
            setCategoryNames(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Failed to fetch categories. Please try again.");
        }
    };

    const fetchCharities = async () => {
        try {
            setLoading(true);
            const charityAddresses = await authManagerContract.getAllCharities();
            const charityDetails = await Promise.all(
                charityAddresses.map(async (address) => {
                    const details = await authManagerContract.getCharityDetails(address);
                    return {
                        address,
                        name: details[0],
                        description: details[1],
                        isApproved: details[4],
                        isActive: details[5],
                        category: details[6],
                        tags: details[7]
                    };
                })
            );
            setCharities(charityDetails);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching charities:", error);
            setError("Failed to fetch charities. Please try again.");
            setLoading(false);
        }
    };

    const handleApproval = async (charityAddress, approve) => {
        try {
            setLoading(true);
            let transaction;
            if (approve) {
                transaction = await authManagerContract.approveCharity(charityAddress);
            } else {
                transaction = await authManagerContract.disapproveCharity(charityAddress);
            }

            // Wait for the transaction to be mined
            await transaction.wait();

            // Update the local state immediately after the contract call
            setCharities(prevCharities =>
                prevCharities.map(charity =>
                    charity.address === charityAddress
                        ? { ...charity, isApproved: approve }
                        : charity
                )
            );

            setLoading(false);
        } catch (error) {
            console.error(`Error ${approve ? 'approving' : 'disapproving'} charity:`, error);
            setError(`Failed to ${approve ? 'approve' : 'disapprove'} charity. Please try again.`);
            setLoading(false);
        }
    };

    const filteredAndSortedCharities = charities
        .filter(charity =>
            charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            charity.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(charity => {
            if (filterStatus === 'approved') return charity.isApproved;
            if (filterStatus === 'notApproved') return !charity.isApproved;
            return true;
        })
        .sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    const toggleSortOrder = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Briefcase className="h-8 w-8 text-blue-500" />
                                <span className="ml-2 text-2xl font-semibold text-gray-900">Admin Dashboard</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-700 mr-4">Admin: {adminAddress.slice(0, 6)}...{adminAddress.slice(-4)}</span>
                            <button
                                onClick={onDisconnect}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
                            >
                                <LogOut className="mr-2" size={18} />
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between">
                    <div className="w-full md:w-1/3 mb-4 md:mb-0">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search charities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>
                    <div className="w-full md:w-2/3 flex justify-end space-x-4">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Charities</option>
                            <option value="approved">Approved</option>
                            <option value="notApproved">Not Approved</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="category">Sort by Category</option>
                        </select>
                        <button
                            onClick={toggleSortOrder}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
                        >
                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedCharities.map((charity) => (
                        <div key={charity.address} className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-2">{charity.name}</h2>
                                <p className="text-gray-600 mb-4">{charity.description}</p>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 mb-1">Address:</p>
                                    <p className="font-mono text-sm">{charity.address}</p>
                                </div>
                                <div className="flex items-center mb-4">
                                    <Briefcase className="text-blue-500 mr-2" size={18} />
                                    <span className="text-sm">{categoryNames[charity.category] || 'Unknown Category'}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {charity.tags.map((tag, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`flex items-center ${charity.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {charity.isApproved ? <Check size={18} className="mr-1" /> : <AlertTriangle size={18} className="mr-1" />}
                                        <span>{charity.isApproved ? 'Approved' : 'Not Approved'}</span>
                                    </div>
                                    <div className={`flex items-center ${charity.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {charity.isActive ? <Check size={18} className="mr-1" /> : <X size={18} className="mr-1" />}
                                        <span>{charity.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleApproval(charity.address, !charity.isApproved)}
                                    className={`w-full ${charity.isApproved
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                        } text-white font-bold py-2 px-4 rounded transition duration-300`}
                                >
                                    {charity.isApproved ? 'Disapprove' : 'Approve'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;