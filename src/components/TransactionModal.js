import React from 'react';

const TransactionModal = ({ isOpen, onClose, transactions, getTransactionStatus }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Your Transactions</h3>
                    <div className="mt-2 px-7 py-3">
                        {transactions.length === 0 ? (
                            <p>No transactions found.</p>
                        ) : (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="border p-4 rounded text-left">
                                        <p><strong>ID:</strong> {tx.id}</p>
                                        <p><strong>Type:</strong> {tx.type === 0 ? 'Scheduled' : 'Instant'}</p>
                                        <p><strong>Beneficiary:</strong> {tx.beneficiary}</p>
                                        <p><strong>Amount:</strong> {tx.amount} ETH</p>
                                        <p><strong>Release Time:</strong> {tx.releaseTime.toLocaleString()}</p>
                                        <p><strong>Approvals:</strong> {tx.approvals}</p>
                                        <p><strong>Status:</strong> {getTransactionStatus(tx)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="items-center px-4 py-3">
                        <button
                            id="ok-btn"
                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;