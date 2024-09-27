import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { AUTH_MANAGER_ABI } from '../abis/AuthManager';
import { COMBINED_TIMELOCK_ABI } from '../abis/CombinedTimeLockABI';
import { Heart, Users, DollarSign, AlertCircle } from 'lucide-react';

const AUTH_MANAGER_ADDRESS = process.env.REACT_APP_AUTH_MANAGER_ADDRESS;
const COMBINED_TIMELOCK_ADDRESS = process.env.REACT_APP_COMBINED_TIMELOCK_ADDRESS;

const MainPage = ({ setUserState, userState, disconnectWallet }) => {
    const navigate = useNavigate();
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registrationType, setRegistrationType] = useState('');
    const [registrationData, setRegistrationData] = useState({ name: '', email: '', description: '' });
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(0);
    const [tags, setTags] = useState('');

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

    useEffect(() => {
        if (userState.authManagerContract) {
            fetchCategories();
        }
    }, [userState.authManagerContract]);

    useEffect(() => {
        if (userState.isUser) {
            navigate('/dashboard');
        } else if (userState.isCharity) {
            navigate('/charity-dashboard');
        } else if (userState.isAdmin) {
            navigate('/admin-dashboard');
        }
    }, [userState.isUser, userState.isCharity, userState.isAdmin, navigate]);

    const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            disconnectWallet();
        } else if (accounts[0] !== userState.address) {
            // User has switched accounts
            await selectAddress(accounts[0]);
        }
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    await selectAddress(accounts[0]);
                }
            } catch (error) {
                console.error("User denied account access or an error occurred:", error);
                setError("Failed to connect wallet. Please try again and make sure to accept the connection request.");
            }
        } else {
            setError("Please install MetaMask to use this application.");
        }
    };

    const selectAddress = async (selectedAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner(selectedAddress);
            const authManagerContract = new ethers.Contract(AUTH_MANAGER_ADDRESS, AUTH_MANAGER_ABI, signer);
            const timeLockContract = new ethers.Contract(COMBINED_TIMELOCK_ADDRESS, COMBINED_TIMELOCK_ABI, signer);

            const isUserRegistered = await authManagerContract.isUserRegistered(selectedAddress);
            const isCharityRegistered = await authManagerContract.isCharityRegistered(selectedAddress);
            const isActive = isUserRegistered ? await authManagerContract.isUserActive(selectedAddress) : true;
            const isAdmin = await authManagerContract.isAdmin(selectedAddress);
            const isSignatory = await timeLockContract.isSignatory(selectedAddress);

            setUserState({
                address: selectedAddress,
                authManagerContract: authManagerContract,
                timeLockContract: timeLockContract,
                isConnected: true,
                isUser: isUserRegistered,
                isCharity: isCharityRegistered,
                isActive: isActive,
                isAdmin: isAdmin,
                isSignatory: isSignatory
            });

            if (isAdmin) {
                navigate('/admin-dashboard');
            }
            else if (isUserRegistered) {
                navigate('/dashboard');
            } else if (isCharityRegistered) {
                navigate('/charity-dashboard');
            }
        } catch (error) {
            console.error("An error occurred while selecting the address:", error);
            setError("Failed to select the address. Please try again.");
        }
    };

    const fetchCategories = async () => {
        try {
            const categoryCount = await userState.authManagerContract.getCategoryCount();
            const fetchedCategories = [];
            for (let i = 0; i < categoryCount; i++) {
                const categoryName = await userState.authManagerContract.getCategoryName(i);
                fetchedCategories.push(categoryName);
            }
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'category') {
            setSelectedCategory(parseInt(value));
        } else if (name === 'tags') {
            setTags(value);
        } else {
            setRegistrationData(prevData => ({ ...prevData, [name]: value }));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!userState.authManagerContract) {
            console.error("AuthManager contract is not initialized");
            setError("AuthManager contract is not initialized. Please try reconnecting your wallet.");
            return;
        }

        try {
            let tx;
            if (registrationType === 'user') {
                tx = await userState.authManagerContract.registerAsUser(registrationData.name, registrationData.email);
            } else if (registrationType === 'charity') {
                const tagArray = tags.split(',').map(tag => tag.trim());
                tx = await userState.authManagerContract.registerAsCharity(
                    registrationData.name,
                    registrationData.description,
                    userState.address,
                    selectedCategory,
                    tagArray
                );
            }

            await tx.wait();

            // Update the global userState after successful registration
            setUserState(prevState => ({
                ...prevState,
                isUser: registrationType === 'user',
                isCharity: registrationType === 'charity'
            }));

            setShowRegistrationForm(false);
            setError('');
            // Navigation will be handled by the useEffect hook
        } catch (error) {
            console.error("An error occurred during registration:", error);
            let errorMessage = "Registration failed. Please try again.";

            if (error.data && error.data.data && error.data.data.reason) {
                errorMessage += " " + error.data.data.reason;
            } else if (error.message) {
                errorMessage += " " + error.message;
            }

            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
            <nav className="bg-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-2xl font-bold flex items-center">
                            <Heart className="mr-2" /> DonationChain
                        </div>
                        {!userState.isConnected ? (
                            <button onClick={connectWallet} className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-full hover:bg-blue-100 transition duration-300">
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {!userState.isUser && !userState.isCharity && !userState.isAdmin && (
                                    <button onClick={() => setShowRegistrationForm(true)} className="bg-green-500 text-white font-semibold py-2 px-6 rounded-full hover:bg-green-600 transition duration-300">
                                        Register
                                    </button>
                                )}
                                <button onClick={disconnectWallet} className="bg-red-500 text-white font-semibold py-2 px-6 rounded-full hover:bg-red-600 transition duration-300">
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-12">
                <h1 className="text-5xl font-bold text-center mb-8 text-blue-800">Welcome to DonationChain</h1>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white shadow-xl rounded-lg p-8 mb-8">
                        <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                            DonationChain is a revolutionary decentralized platform that connects compassionate donors with verified charities. Make secure, transparent donations using blockchain technology and be part of a global movement for positive change.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-blue-50 p-6 rounded-lg text-center">
                                <Users className="mx-auto mb-4 text-blue-600" size={48} />
                                <h3 className="text-xl font-semibold mb-2">Connect</h3>
                                <p>Join a community of like-minded individuals passionate about making a difference.</p>
                            </div>
                            <div className="bg-green-50 p-6 rounded-lg text-center">
                                <Heart className="mx-auto mb-4 text-green-600" size={48} />
                                <h3 className="text-xl font-semibold mb-2">Support</h3>
                                <p>Choose from a variety of verified charities and causes that resonate with you.</p>
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-lg text-center">
                                <DollarSign className="mx-auto mb-4 text-yellow-600" size={48} />
                                <h3 className="text-xl font-semibold mb-2">Track</h3>
                                <p>Monitor your donations and see the real-world impact of your generosity.</p>
                            </div>
                        </div>
                    </div>

                    {userState.isConnected ? (
                        <div className="bg-white shadow-lg rounded-lg p-6">
                            <p className="font-semibold text-lg mb-2">Connected Address:</p>
                            <p className="bg-gray-100 p-3 rounded-md break-all">{userState.address}</p>
                            {!userState.isUser && !userState.isCharity && (
                                <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700" role="alert">
                                    <p className="font-bold">Not Registered</p>
                                    <p>You're not registered yet. Click the 'Register' button to get started!</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                            <p className="font-bold">Get Started</p>
                            <p>Please connect your wallet to start making a difference today!</p>
                        </div>
                    )}
                </div>

                {showRegistrationForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center" id="registration-modal">
                        <div className="relative p-8 border w-full max-w-md m-4 shadow-lg rounded-lg bg-white">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Join DonationChain</h3>
                            {/* Error Alert */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700" role="alert">
                                    <p className="font-bold">Registration Error</p>
                                    <p>{error}</p>
                                </div>
                            )}
                            <div className="mb-6">
                                <button
                                    onClick={() => setRegistrationType('user')}
                                    className={`mr-4 px-6 py-2 rounded-full text-lg ${registrationType === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} transition duration-300`}
                                >
                                    Donor
                                </button>
                                <button
                                    onClick={() => setRegistrationType('charity')}
                                    className={`px-6 py-2 rounded-full text-lg ${registrationType === 'charity' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'} transition duration-300`}
                                >
                                    Charity
                                </button>
                            </div>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <input
                                    type="text"
                                    name="name"
                                    value={registrationData.name}
                                    onChange={handleInputChange}
                                    placeholder="Name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {registrationType === 'user' && (
                                    <input
                                        type="email"
                                        name="email"
                                        value={registrationData.email}
                                        onChange={handleInputChange}
                                        placeholder="Email"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                )}
                                {registrationType === 'charity' && (
                                    <>
                                        <textarea
                                            name="description"
                                            value={registrationData.description}
                                            onChange={handleInputChange}
                                            placeholder="Description"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            rows="3"
                                        />
                                        <select
                                            name="category"
                                            value={selectedCategory}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {categories.map((category, index) => (
                                                <option key={index} value={index}>{category}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            name="tags"
                                            value={tags}
                                            onChange={handleInputChange}
                                            placeholder="Tags (comma-separated)"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </>
                                )}
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        className="w-full px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-300"
                                    >
                                        Register
                                    </button>
                                    <button
                                        onClick={() => setShowRegistrationForm(false)}
                                        className="w-full px-6 py-3 bg-gray-200 text-gray-800 text-lg font-semibold rounded-md shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <footer className="bg-gray-800 text-white py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-between items-center">
                        <div className="w-full md:w-1/3 text-center md:text-left mb-6 md:mb-0">
                            <h2 className="text-2xl font-bold mb-2">DonationChain</h2>
                            <p>Empowering generosity through blockchain technology</p>
                        </div>
                        <div className="w-full md:w-1/3 text-center mb-6 md:mb-0">
                            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
                            <ul>
                                <li><a href="#" className="hover:text-blue-300">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-300">How It Works</a></li>
                                <li><a href="#" className="hover:text-blue-300">FAQs</a></li>
                            </ul>
                        </div>
                        <div className="w-full md:w-1/3 text-center md:text-right">
                            <h3 className="text-lg font-semibold mb-2">Connect With Us</h3>
                            <div className="flex justify-center md:justify-end space-x-4">
                                <a href="#" className="hover:text-blue-300"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="hover:text-blue-300"><i className="fab fa-facebook"></i></a>
                                <a href="#" className="hover:text-blue-300"><i className="fab fa-instagram"></i></a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-sm">
                        <p>&copy; 2024 DonationChain. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MainPage;