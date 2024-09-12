import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { USER_AUTH_ABI } from '../abis/UserAuth';

// Address of your deployed UserAuth contract
const USER_AUTH_ADDRESS = "0x0D9E598F452E903De4051A64B0aA302028825E43";

const MainPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [address, setAddress] = useState('');
    const [availableAddresses, setAvailableAddresses] = useState([]);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [userAuthContract, setUserAuthContract] = useState(null);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        // Add any other fields you want to collect
    });

    useEffect(() => {
        checkIfWalletIsConnected();
    }, []);

    const checkIfWalletIsConnected = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(provider);

                const accounts = await provider.listAccounts();
                if (accounts.length > 0) {
                    setAvailableAddresses(accounts);
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("An error occurred while checking the wallet connection:", error);
            }
        } else {
            console.log('Please install MetaMask!');
        }
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setAvailableAddresses(accounts);
                setIsConnected(true);
            } catch (error) {
                console.error("User denied account access");
            }
        } else {
            alert('Please install MetaMask!');
        }
    };

    const selectAddress = async (selectedAddress) => {
        try {
            const signer = provider.getSigner(selectedAddress);
            const userAuthContract = new ethers.Contract(USER_AUTH_ADDRESS, USER_AUTH_ABI, signer);

            setAddress(selectedAddress);
            setSigner(signer);
            setUserAuthContract(userAuthContract);

            // Check if user is registered
            const registered = await userAuthContract.isUserRegistered(selectedAddress);
            setIsRegistered(registered);
        } catch (error) {
            console.error("An error occurred while selecting the address:", error);
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
        if (!userAuthContract) {
            console.error("UserAuth contract is not initialized");
            return;
        }

        try {
            console.log("Attempting to register with:", registrationData);
            const tx = await userAuthContract.register(registrationData.name, registrationData.email);
            console.log("Transaction sent:", tx.hash);
            const receipt = await tx.wait();
            console.log("Transaction confirmed:", receipt.transactionHash);

            console.log("Registration successful!");
            setIsRegistered(true);
            setShowRegistrationForm(false);
        } catch (error) {
            console.error("An error occurred during registration:", error);
            if (error.error && error.error.message) {
                console.error("Contract error message:", error.error.message);
            }
            if (error.transaction) {
                console.error("Failed transaction:", error.transaction);
            }
            // Display error to user
            alert(`Registration failed: ${error.message}`);
        }
    };

    const handleLogin = () => {
        // In this case, "login" is just checking if the user is registered
        console.log("User is already logged in (registered)");
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-indigo-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">TimeLock dApp</div>
                        <div>
                            {!isConnected ? (
                                <button onClick={connectWallet} className="bg-transparent hover:bg-indigo-700 text-white font-semibold py-2 px-4 border border-white rounded">
                                    Connect Wallet
                                </button>
                            ) : !address ? (
                                <select onChange={(e) => selectAddress(e.target.value)} className="bg-white text-indigo-600 font-semibold py-2 px-4 rounded">
                                    <option value="">Select Address</option>
                                    {availableAddresses.map((addr) => (
                                        <option key={addr} value={addr}>
                                            {addr}
                                        </option>
                                    ))}
                                </select>
                            ) : !isRegistered ? (
                                <button onClick={() => setShowRegistrationForm(true)} className="bg-transparent hover:bg-indigo-700 text-white font-semibold py-2 px-4 border border-white rounded">
                                    Register
                                </button>
                            ) : (
                                <button onClick={handleLogin} className="bg-transparent hover:bg-indigo-700 text-white font-semibold py-2 px-4 border border-white rounded">
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-center mb-8">Welcome to TimeLock dApp</h1>
                <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
                    <p className="text-gray-600 mb-4">
                        TimeLock dApp allows you to schedule future transactions securely on the blockchain.
                    </p>
                    {isConnected ? (
                        <div>
                            {address ? (
                                <p className="font-semibold">Connected Address: {address}</p>
                            ) : (
                                <p className="text-yellow-600">Please select an address to continue.</p>
                            )}
                            {isRegistered ? (
                                <p className="mt-2 text-green-600">You're registered and ready to use the dApp!</p>
                            ) : address ? (
                                <p className="mt-2 text-yellow-600">Please register to start using the dApp.</p>
                            ) : null}
                        </div>
                    ) : (
                        <p className="text-yellow-600">Please connect your wallet to get started.</p>
                    )}
                </div>

                {showRegistrationForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Register</h3>
                                <form onSubmit={handleRegister} className="mt-2 px-7 py-3">
                                    <input
                                        type="text"
                                        name="name"
                                        value={registrationData.name}
                                        onChange={handleInputChange}
                                        placeholder="Name"
                                        className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                        required
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={registrationData.email}
                                        onChange={handleInputChange}
                                        placeholder="Email"
                                        className="mt-2 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-sm focus:ring-1"
                                        required
                                    />
                                    <div className="items-center px-4 py-3">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        >
                                            Register
                                        </button>
                                    </div>
                                </form>
                                <button onClick={() => setShowRegistrationForm(false)} className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MainPage;