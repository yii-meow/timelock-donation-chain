import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import TransactionModal from "./TransactionModal";

const TransactionManager = ({ timeLockContract, userAddress }) => {
    const [signatoryAddress, setSignatoryAddress] = useState('');
    const [viewTransactionId, setViewTransactionId] = useState('');
    const [approveTransactionId, setApproveTransactionId] = useState('');
    const [modifyTransactionId, setModifyTransactionId] = useState('');
    const [newBeneficiary, setNewBeneficiary] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newReleaseTime, setNewReleaseTime] = useState('');
    const [cancelTransactionId, setCancelTransactionId] = useState('');
    const [executeTransactionId, setExecuteTransactionId] = useState('');

    const [signatoryResult, setSignatoryResult] = useState('');
    const [viewResult, setViewResult] = useState('');
    const [approveResult, setApproveResult] = useState('');
    const [modifyResult, setModifyResult] = useState('');
    const [cancelResult, setCancelResult] = useState('');
    const [executeResult, setExecuteResult] = useState('');

    const [userTransactions, setUserTransactions] = useState([]);
    const [transactionCount, setTransactionCount] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTransactionCount();
    }, []);

    useEffect(() => {
        if (transactionCount > 0) {
            fetchUserTransactions();
        }
    }, [transactionCount]);

    const fetchTransactionCount = async () => {
        try {
            const count = await timeLockContract.transactionCount();
            setTransactionCount(count.toNumber());
        } catch (error) {
            console.error("Error fetching transaction count:", error);
        }
    };

    const fetchUserTransactions = async () => {
        try {
            const transactions = [];
            for (let i = 1; i <= transactionCount; i++) {
                const tx = await timeLockContract.transactions(i)
                const normalizedUserAddress = userAddress.toLowerCase();
                const normalizedCreator = tx.creator.toLowerCase();
                const normalizedBeneficiary = tx.beneficiary.toLowerCase();

                if (normalizedCreator === normalizedUserAddress || normalizedBeneficiary === normalizedUserAddress) {
                    const details = await timeLockContract.viewTransaction(i);
                    transactions.push({
                        id: i,
                        type: details[0],
                        beneficiary: details[1],
                        amount: ethers.utils.formatEther(details[2]),
                        releaseTime: new Date(details[3].toNumber() * 1000),
                        executed: details[4],
                        approvals: details[5].toNumber(),
                        modified: details[6]
                    });
                }
            }
            setUserTransactions(transactions);
        } catch (error) {
            console.error("Error fetching user transactions:", error);
        }
    };

    const getTransactionStatus = (transaction) => {
        if (transaction.executed) return "Executed";
        if (transaction.type === 3) return "Cancelled"; // Assuming 3 is the value for Cancelled in the enum
        if (transaction.releaseTime > new Date()) return "Pending";
        return "Ready for Execution";
    };

    const handleCheckSignatory = async () => {
        try {
            if (!ethers.utils.isAddress(signatoryAddress)) {
                throw new Error("Invalid address");
            }
            const isSignatory = await timeLockContract.isSignatory(signatoryAddress);
            setSignatoryResult(`Is Signatory: ${isSignatory}`);
        } catch (error) {
            setSignatoryResult(`Error: ${error.message}`);
            if (error.data) {
                setSignatoryResult(signatoryResult + " " + error.data.data.reason);
            }
        }
    };

    const handleViewTransaction = async () => {
        try {
            if (isNaN(viewTransactionId)) {
                throw new Error("Transaction ID must be a number");
            }
            const transaction = await timeLockContract.viewTransaction(viewTransactionId);
            setViewResult(JSON.stringify({
                Type: transaction[0],
                Beneficiary: transaction[1],
                Amount: ethers.utils.formatEther(transaction[2]) + " ETH",
                ReleaseTime: new Date(transaction[3].toNumber() * 1000).toLocaleString(),
                Executed: transaction[4],
                Approvals: transaction[5].toString(),
                Modified: transaction[6]
            }, null, 2));
        } catch (error) {
            setViewResult(`Error: ${error.message}`);
            if (error.data) {
                setViewResult(viewResult + " " + error.data.data.reason);
            }
        }
    };

    const handleApproveTransaction = async () => {
        try {
            if (isNaN(approveTransactionId)) {
                throw new Error("Transaction ID must be a number");
            }
            const tx = await timeLockContract.approveTransaction(approveTransactionId);
            await tx.wait();
            setApproveResult(`Transaction ID ${approveTransactionId} approved successfully. Hash: ${tx.hash.slice(0, 10)}...`);
        } catch (error) {
            setApproveResult(`Error: ${error.message}`);
            if (error.data) {
                setApproveResult(approveResult + " " + error.data.data.reason);
            }
        }
    };

    const handleModifyTransaction = async () => {
        try {
            if (isNaN(modifyTransactionId) || !ethers.utils.isAddress(newBeneficiary) || isNaN(newAmount) || !newReleaseTime) {
                throw new Error("Invalid input");
            }
            const newReleaseTimeUnix = Math.floor(new Date(newReleaseTime).getTime() / 1000);
            const tx = await timeLockContract.modifyTransaction(
                modifyTransactionId,
                newBeneficiary,
                ethers.utils.parseEther(newAmount),
                newReleaseTimeUnix
            );
            await tx.wait();
            setModifyResult(`Transaction ID ${modifyTransactionId} modified successfully. Hash: ${tx.hash.slice(0, 10)}...`);
        } catch (error) {
            setModifyResult(`Error: ${error.message}`);
            if (error.data) {
                setModifyResult(modifyResult + " " + error.data.data.reason);
            }
        }
    };

    const handleCancelTransaction = async () => {
        try {
            if (isNaN(cancelTransactionId)) {
                throw new Error("Transaction ID must be a number");
            }
            const tx = await timeLockContract.cancelTransaction(cancelTransactionId);
            await tx.wait();
            setCancelResult(`Transaction ID ${cancelTransactionId} canceled successfully. Hash: ${tx.hash.slice(0, 10)}...`);
        } catch (error) {
            setCancelResult(`Error: ${error.message}`);
            if (error.data) {
                setCancelResult(cancelResult + " " + error.data.data.reason);
            }
        }
    };

    const handleExecuteTransaction = async () => {
        try {
            if (isNaN(executeTransactionId)) {
                throw new Error("Transaction ID must be a number");
            }
            const transaction = await timeLockContract.viewTransaction(executeTransactionId);
            const amount = transaction[2];
            const tx = await timeLockContract.executeTransaction(executeTransactionId, { value: amount });
            await tx.wait();
            setExecuteResult(`Transaction ID ${executeTransactionId} executed successfully. Hash: ${tx.hash.slice(0, 10)}...`);
        } catch (error) {
            setExecuteResult(`Error: ${error.message}`);
            if (error.data) {
                setExecuteResult(executeResult + " " + error.data.data.reason);
            }
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Transaction of Donations</h2>

            <div className="mb-12">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    View All Donation History
                </button>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transactions={userTransactions}
                getTransactionStatus={getTransactionStatus}
            />

            <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Check if Signatory</h3>
                <input
                    type="text"
                    value={signatoryAddress}
                    onChange={(e) => setSignatoryAddress(e.target.value)}
                    placeholder="Address"
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleCheckSignatory} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Check</button>
                {signatoryResult && <div className="mt-2 p-2 bg-gray-100 rounded">{signatoryResult}</div>}
            </div>

            <div className="mb-5">
                <h3 className="text-xl font-semibold mb-2">View Donation Transaction</h3>
                <input
                    type="number"
                    value={viewTransactionId}
                    onChange={(e) => setViewTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleViewTransaction} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">View</button>
                {viewResult && <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">{viewResult}</pre>}
            </div>

            <div className="mb-5">
                <h3 className="text-xl font-semibold mb-2">Approve Donation Transaction</h3>
                <input
                    type="number"
                    value={approveTransactionId}
                    onChange={(e) => setApproveTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleApproveTransaction} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Approve</button>
                {approveResult && <div className="mt-2 p-2 bg-gray-100 rounded">{approveResult}</div>}
            </div>

            <div className="mb-5">
                <h3 className="text-xl font-semibold mb-2">Modify Donation Transaction</h3>
                <input
                    type="number"
                    value={modifyTransactionId}
                    onChange={(e) => setModifyTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full p-2 border rounded mb-2"
                />
                <input
                    type="text"
                    value={newBeneficiary}
                    onChange={(e) => setNewBeneficiary(e.target.value)}
                    placeholder="New Beneficiary Address"
                    className="w-full p-2 border rounded mb-2"
                />
                <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="New Amount (ETH)"
                    className="w-full p-2 border rounded mb-2"
                />
                <input
                    type="datetime-local"
                    value={newReleaseTime}
                    onChange={(e) => setNewReleaseTime(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleModifyTransaction} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Modify</button>
                {modifyResult && <div className="mt-2 p-2 bg-gray-100 rounded">{modifyResult}</div>}
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Cancel Donation Transaction</h3>
                <input
                    type="number"
                    value={cancelTransactionId}
                    onChange={(e) => setCancelTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleCancelTransaction} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Cancel</button>
                {cancelResult && <div className="mt-2 p-2 bg-gray-100 rounded">{cancelResult}</div>}
            </div>

            <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Execute Donation Transaction</h3>
                <input
                    type="number"
                    value={executeTransactionId}
                    onChange={(e) => setExecuteTransactionId(e.target.value)}
                    placeholder="Transaction ID"
                    className="w-full p-2 border rounded mb-2"
                />
                <button onClick={handleExecuteTransaction} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Execute</button>
                {executeResult && <div className="mt-2 p-2 bg-gray-100 rounded">{executeResult}</div>}
            </div>
        </div>
    );
};

export default TransactionManager;