import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Heart, Search, ExternalLink } from 'lucide-react';

const CharityList = ({ authManagerContract }) => {
    const [charities, setCharities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryNames, setCategoryNames] = useState({});

    useEffect(() => {
        fetchCharities();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const categoryCount = await authManagerContract.getCategoryCount();
            const categories = {};
            for (let i = 0; i < categoryCount; i++) {
                const categoryName = await authManagerContract.getCategoryName(i);
                categories[i] = categoryName;
            }
            setCategoryNames(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            setError("Failed to fetch categories. Please try again later.");
        }
    };

    const fetchCharities = async () => {
        setIsLoading(true);
        setError('');
        try {
            const charityAddresses = await authManagerContract.getAllCharities();
            const charityDetails = await Promise.all(
                charityAddresses.map(async (address) => {
                    const details = await authManagerContract.getCharityDetails(address);
                    return {
                        address,
                        name: details[0],
                        description: details[1],
                        isApproved: details[4],
                        category: details[6],
                        totalDonations: ethers.utils.formatEther('0'), // Placeholder as it's not in your contract
                        website: '#' // Placeholder as it's not in your contract
                    };
                })
            );
            setCharities(charityDetails);
        } catch (error) {
            console.error("Failed to fetch charities:", error);
            setError("Failed to load charities. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCharities = charities.filter(charity =>
        charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (categoryNames[charity.category] && categoryNames[charity.category].toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-blue-600">Registered Charities</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search charities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
            </div>
            {filteredCharities.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">No charities found matching your search.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCharities.map((charity) => (
                        <div key={charity.address} className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                            <div className="bg-blue-500 text-white p-4">
                                <h3 className="text-xl font-semibold mb-1">{charity.name}</h3>
                                <p className="text-sm">{categoryNames[charity.category] || 'Unknown Category'}</p>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-600 mb-4">Description: {charity.description}</p>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <span>Total Donations: {charity.totalDonations} ETH</span>
                                    <span className={`px-2 py-1 rounded ${charity.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {charity.isApproved ? 'Approved' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                                <a href={`https://etherscan.io/address/${charity.address}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                                    <ExternalLink size={16} className="mr-1" />
                                    View on Etherscan
                                </a>
                                <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    Visit Website
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CharityList;