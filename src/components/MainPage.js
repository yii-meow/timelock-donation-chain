import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { AUTH_MANAGER_ABI } from '../abis/AuthManager';
import { COMBINED_TIMELOCK_ABI } from '../abis/CombinedTimeLockABI';
import Logo from '../Logo';

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
        // checkIfWalletIsConnected();
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

    // const checkIfWalletIsConnected = async () => {
    //     if (typeof window.ethereum !== 'undefined') {
    //         try {
    //             const provider = new ethers.providers.Web3Provider(window.ethereum);
    //             const accounts = await provider.listAccounts();
    //             if (accounts.length > 0) {
    //                 await connectWallet();
    //             }
    //         } catch (error) {
    //             setError("Failed to connect to the wallet. Please try again.");
    //         }
    //     } else {
    //         setError("Please install MetaMask to use this application.");
    //     }
    // };

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

            setUserState({
                address: selectedAddress,
                authManagerContract: authManagerContract,
                timeLockContract: timeLockContract,
                isConnected: true,
                isUser: isUserRegistered,
                isCharity: isCharityRegistered,
                isActive: isActive,
                isAdmin: isAdmin
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

            // Navigation will be handled by the useEffect hook
        } catch (error) {
            console.error("An error occurred during registration:", error);
            setError("Registration failed. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">DonationChain</div>
                        {!userState.isConnected ? (
                            <button onClick={connectWallet} className="bg-white text-blue-600 font-semibold py-2 px-4 rounded">
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="flex items-center space-x-4">
                                {!userState.isUser && !userState.isCharity && !userState.isAdmin && (
                                    <button onClick={() => setShowRegistrationForm(true)} className="bg-white text-blue-600 font-semibold py-2 px-4 rounded">
                                        Register
                                    </button>
                                )}
                                <button onClick={disconnectWallet} className="bg-red-500 text-white font-semibold py-2 px-4 rounded">
                                    Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-center mb-8">Welcome to Donation Chain</h1>
                <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
                    <p className="text-gray-600 mb-4">
                        DonationChain is a decentralized platform that connects donors with verified charities. Make secure, transparent donations using blockchain technology.
                    </p>
                    {userState.isConnected ? (
                        <>
                            <p className="font-semibold">Connected Address: {userState.address}</p>
                            {!userState.isUser && !userState.isCharity && (
                                <div className="p-4 mb-2 text-sm text-red-800 rounded-lg bg-red-50 dark:text-red-400 mt-5" role="alert">
                                    You are not registered yet!
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-yellow-600">Please connect your wallet to get started.</p>
                    )}
                </div>

                {showRegistrationForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="registration-modal">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Register as a User or Charity</h3>
                            <div className="mb-4">
                                <button
                                    onClick={() => setRegistrationType('user')}
                                    className={`mr-2 px-4 py-2 rounded ${registrationType === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                >
                                    User
                                </button>
                                <button
                                    onClick={() => setRegistrationType('charity')}
                                    className={`px-4 py-2 rounded ${registrationType === 'charity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                >
                                    Charity
                                </button>
                            </div>
                            <form onSubmit={handleRegister}>
                                <input
                                    type="text"
                                    name="name"
                                    value={registrationData.name}
                                    onChange={handleInputChange}
                                    placeholder="Name"
                                    className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                    required
                                />
                                {registrationType === 'user' && (
                                    <input
                                        type="email"
                                        name="email"
                                        value={registrationData.email}
                                        onChange={handleInputChange}
                                        placeholder="Email"
                                        className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                        required
                                    />
                                )}
                                {registrationType === 'charity' && (
                                    <>
                                        <input
                                            type="text"
                                            name="description"
                                            value={registrationData.description}
                                            onChange={handleInputChange}
                                            placeholder="Description"
                                            className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                            required
                                        />
                                        <select
                                            name="category"
                                            value={selectedCategory}
                                            onChange={handleInputChange}
                                            className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
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
                                            className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                        />
                                    </>
                                )}
                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    >
                                        Register
                                    </button>
                                </div>
                            </form>
                            <button
                                onClick={() => setShowRegistrationForm(false)}
                                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MainPage;