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

    const handleRegister = async () => {
        if (!userAuthContract) {
            console.error("UserAuth contract is not initialized");
            return;
        }

        try {
            // You might want to get these values from input fields
            const name = "John Doe";
            const email = "john@example.com";

            const tx = await userAuthContract.register(name, email);
            await tx.wait();

            console.log("Registration successful!");
            setIsRegistered(true);
        } catch (error) {
            console.error("An error occurred during registration:", error);
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
                                <button onClick={handleRegister} className="bg-transparent hover:bg-indigo-700 text-white font-semibold py-2 px-4 border border-white rounded">
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
            </main>
        </div>
    );
};

export default MainPage;