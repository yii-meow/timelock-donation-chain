import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CharityProfile from './CharityProfile';

const CharityDashboard = ({ address, authManagerContract, onDisconnect }) => {
    const [isApproved, setIsApproved] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkApprovalStatus();
    }, []);

    const checkApprovalStatus = async () => {
        try {
            const approved = await authManagerContract.isCharityApproved(address);
            setIsApproved(approved);
        } catch (error) {
            console.error("Error checking charity approval status:", error);
        }
    };

    const handleDisconnect = () => {
        onDisconnect();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-600 text-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="text-xl font-bold">Charity Dashboard</div>
                        <div className="flex items-center space-x-4">
                            <span className="mr-4">{address.slice(0, 6)}...{address.slice(-4)}</span>
                            {isApproved ? (
                                <span className="bg-green-500 text-white px-2 py-1 rounded">Approved</span>
                            ) : (
                                <span className="bg-yellow-500 text-white px-2 py-1 rounded">Pending Approval</span>
                            )}
                            <button
                                onClick={handleDisconnect}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <CharityProfile address={address} authManagerContract={authManagerContract} />
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