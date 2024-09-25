import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Check, X, Eye, Edit, Trash2, PlayCircle, User, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const TransactionManager = ({ timeLockContract, userAddress }) => {
    const [transactions, setTransactions] = useState([]);
    const [transactionCount, setTransactionCount] = useState(0);
    const [activeTab, setActiveTab] = useState('view');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [newBeneficiary, setNewBeneficiary] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newReleaseTime, setNewReleaseTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
            setError("Failed to fetch transaction count. Please try again.");
        }
    };

    const fetchUserTransactions = async () => {
        setLoading(true);
        try {
            const transactions = [];
            for (let i = 1; i <= transactionCount; i++) {
                const tx = await timeLockContract.transactions(i);
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
            setTransactions(transactions);
        } catch (error) {
            console.error("Error fetching user transactions:", error);
            setError("Failed to fetch transactions. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getTransactionStatus = (transaction) => {
        if (transaction.executed) return "Executed";
        if (transaction.type === 3) return "Cancelled"; // Assuming 3 is the value for Cancelled in the enum
        if (transaction.releaseTime > new Date()) return "Pending";
        return "Ready for Execution";
    };

    const handleAction = async (action, transactionId) => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            let tx;
            switch (action) {
                case 'approve':
                    tx = await timeLockContract.approveTransaction(transactionId);
                    break;
                case 'cancel':
                    tx = await timeLockContract.cancelTransaction(transactionId);
                    break;
                case 'execute':
                    const transaction = await timeLockContract.viewTransaction(transactionId);
                    const amount = transaction[2];
                    tx = await timeLockContract.executeTransaction(transactionId, { value: amount });
                    break;
                case 'modify':
                    if (!newBeneficiary || !newAmount || !newReleaseTime) {
                        throw new Error("Please fill all fields for modification");
                    }
                    const newReleaseTimeUnix = Math.floor(new Date(newReleaseTime).getTime() / 1000);
                    tx = await timeLockContract.modifyTransaction(
                        transactionId,
                        newBeneficiary,
                        ethers.utils.parseEther(newAmount),
                        newReleaseTimeUnix
                    );
                    break;
                default:
                    throw new Error("Invalid action");
            }
            await tx.wait();
            setSuccess(`Transaction ${action}d successfully`);
            fetchUserTransactions();
        } catch (error) {
            console.error(`Error ${action}ing transaction:`, error);
            setError(`Failed to ${action} transaction. ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderTransactionList = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (ETH)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${tx.beneficiary.slice(0, 6)}...${tx.beneficiary.slice(-4)}`}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.releaseTime.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatus(tx) === "Executed" ? "bg-green-100 text-green-800" :
                                    getTransactionStatus(tx) === "Cancelled" ? "bg-red-100 text-red-800" :
                                        getTransactionStatus(tx) === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-blue-100 text-blue-800"
                                    }`}>
                                    {getTransactionStatus(tx)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button onClick={() => handleAction('approve', tx.id)} className="text-blue-600 hover:text-blue-900 mr-2">
                                    <Check size={16} />
                                </button>
                                <button onClick={() => handleAction('cancel', tx.id)} className="text-red-600 hover:text-red-900 mr-2">
                                    <Trash2 size={16} />
                                </button>
                                <button onClick={() => handleAction('execute', tx.id)} className="text-green-600 hover:text-green-900 mr-2">
                                    <PlayCircle size={16} />
                                </button>
                                <button onClick={() => { setSelectedTransaction(tx); setActiveTab('modify'); }} className="text-yellow-600 hover:text-yellow-900">
                                    <Edit size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderModifyForm = () => (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h3 className="text-xl font-bold mb-4">Modify Transaction #{selectedTransaction?.id}</h3>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newBeneficiary">
                    New Beneficiary Address
                </label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="newBeneficiary"
                    type="text"
                    value={newBeneficiary}
                    onChange={(e) => setNewBeneficiary(e.target.value)}
                    placeholder="0x..."
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newAmount">
                    New Amount (ETH)
                </label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="newAmount"
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newReleaseTime">
                    New Release Time
                </label>
                <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="newReleaseTime"
                    type="datetime-local"
                    value={newReleaseTime}
                    onChange={(e) => setNewReleaseTime(e.target.value)}
                />
            </div>
            <div className="flex items-center justify-between">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => handleAction('modify', selectedTransaction.id)}
                >
                    Modify Transaction
                </button>
                <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => setActiveTab('view')}
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-6">Transaction Manager</h2>
            <div className="mb-4">
                <button
                    className={`mr-2 ${activeTab === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} font-bold py-2 px-4 rounded`}
                    onClick={() => setActiveTab('view')}
                >
                    View Transactions
                </button>
                <button
                    className={`${activeTab === 'modify' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} font-bold py-2 px-4 rounded`}
                    onClick={() => setActiveTab('modify')}
                    disabled={!selectedTransaction}
                >
                    Modify Transaction
                </button>
            </div>
            {loading && <div className="text-center">Loading...</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">{success}</div>}
            {activeTab === 'view' ? renderTransactionList() : renderModifyForm()}
        </div>
    );
};

export default TransactionManager;