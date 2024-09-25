import React, { useState } from 'react';
import { ethers } from 'ethers';

const TransactionManager = ({ timeLockContract }) => {
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