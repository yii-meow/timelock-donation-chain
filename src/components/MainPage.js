import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AUTH_MANAGER_ABI } from '../abis/AuthManager';
import UserDashboard from './UserDashboard';
import CharityDashboard from './CharityDashboard';
import Logo from '../Logo';

const AUTH_MANAGER_ADDRESS = process.env.REACT_APP_AUTH_MANAGER_ADDRESS;

const MainPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isUser, setIsUser] = useState(false);
    const [isCharity, setIsCharity] = useState(false);
    const [address, setAddress] = useState('');
    const [availableAddresses, setAvailableAddresses] = useState([]);
    const [authManagerContract, setAuthManagerContract] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registrationType, setRegistrationType] = useState('');
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    const checkIfWalletIsConnected = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);
                const accounts = await provider.listAccounts();
                console.log("Accounts found:", accounts);
                if (accounts.length > 0) {
                    setAvailableAddresses(accounts);
                    await selectAddress(accounts[0]);
                }
            } catch (error) {
                console.error("An error occurred while checking the wallet connection:", error);
                setError("Failed to connect to the wallet. Please try again.");
            }
        } else {
            console.log("Please install MetaMask!");
            setError("Please install MetaMask to use this application.");
        }
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAvailableAddresses(accounts);
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
            const signer = provider.getSigner(selectedAddress);
            const authManagerContract = new ethers.Contract(AUTH_MANAGER_ADDRESS, AUTH_MANAGER_ABI, signer);

            setAddress(selectedAddress);
            setAuthManagerContract(authManagerContract);
            setIsConnected(true);

            const isUserRegistered = await authManagerContract.isUserRegistered(selectedAddress);
            const isCharityRegistered = await authManagerContract.isCharityRegistered(selectedAddress);

            setIsUser(isUserRegistered);
            setIsCharity(isCharityRegistered);
        } catch (error) {
            console.error("An error occurred while selecting the address:", error);
            setError("Failed to select the address. Please try again.");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRegistrationData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!authManagerContract) {
            console.error("AuthManager contract is not initialized");
            return;
        }

        try {
            let tx;
            if (registrationType === 'user') {
                tx = await authManagerContract.registerAsUser(registrationData.name, registrationData.email);
                console.log(tx);
            } else if (registrationType === 'charity') {
                tx = await authManagerContract.registerAsCharity(registrationData.name, registrationData.description, address);
            }

            await tx.wait();

            if (registrationType === 'user') {
                setIsUser(true);
            } else if (registrationType === 'charity') {
                setIsCharity(true);
            }

            setShowRegistrationForm(false);
        } catch (error) {
            console.error("An error occurred during registration:", error);
        }
    };

    const disconnectWallet = () => {
        setIsConnected(false);
        setIsUser(false);
        setIsCharity(false);
        setAddress('');
        setAuthManagerContract(null);
        setError('');
    };

    if (isUser) {
        return <UserDashboard address={address} authManagerContract={authManagerContract} onDisconnect={disconnectWallet} />;
    }

    if (isCharity) {
        return <CharityDashboard address={address} authManagerContract={authManagerContract} onDisconnect={disconnectWallet} />;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">DonationChain</div>
                        {!isConnected ? (
                            <button onClick={connectWallet} className="bg-white text-blue-600 font-semibold py-2 px-4 rounded">
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="flex items-center">
                                <select
                                    value={address}
                                    onChange={(e) => selectAddress(e.target.value)}
                                    className="bg-white text-blue-600 font-semibold py-2 px-4 rounded mr-2"
                                >
                                    <option value="">Select an address</option>
                                    {availableAddresses.map((addr) => (
                                        <option key={addr} value={addr}>
                                            {addr.slice(0, 6)}...{addr.slice(-4)}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={() => setShowRegistrationForm(true)} className="bg-white text-blue-600 font-semibold py-2 px-4 rounded">
                                    Register
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
                    {isConnected ? (
                        <p className="font-semibold">Connected Address: {address}</p>
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
                                    <textarea
                                        name="description"
                                        value={registrationData.description}
                                        onChange={handleInputChange}
                                        placeholder="Charity Description"
                                        className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                        required
                                    />
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