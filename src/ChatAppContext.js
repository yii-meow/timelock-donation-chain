import React, { useState, useEffect, useCallback } from "react";
import { ethers } from 'ethers';
import { CheckIfWalletConnected, connectWallet, connectingWithContract, connectingWithAuthManager } from './apiFeature';

export const ChatAppContext = React.createContext();

export const ChatAppProvider = ({ children, initialUserState }) => {
    const [account, setAccount] = useState(initialUserState.address);
    const [userName, setUserName] = useState("");
    const [friendLists, setFriendLists] = useState([]);
    const [friendMsg, setFriendMsg] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userLists, setUserLists] = useState([]);
    const [error, setError] = useState("");

    const [currentUserName, setCurrentUserName] = useState("");
    const [currentUserAddress, setCurrentUserAddress] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const chatContract = await connectingWithContract();
            const authContract = await connectingWithAuthManager();

            setAccount(initialUserState.address);

            const userName = await authContract.getUserNameByAddress(initialUserState.address);
            setUserName(userName);

            const friendLists = await chatContract.getMyFriendList();
            setFriendLists(friendLists);

            const userLists = await chatContract.getAllAppUsers();
            const userListPromises = userLists.map(async (address) => {
                const name = await authContract.getUserNameByAddress(address);
                return { name, accountAddress: address };
            });
            const resolvedUserLists = await Promise.all(userListPromises);
            setUserLists(resolvedUserLists);

        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load user data");
        }
    };

    const readMessage = useCallback(async (friendAddress) => {
        try {
            const contract = await connectingWithContract();
            const read = await contract.readMessage(friendAddress);
            setFriendMsg(read);
        } catch (error) {
            setError("Currently you have no messages");
        }
    }, []);

    const sendMessage = async ({ msg, address }) => {
        try {
            if (!msg || !address) {
                setError("Please type a message");
                return;
            }

            const contract = await connectingWithContract();
            const addMessage = await contract.sendMessage(address, msg);
            setLoading(true);
            await addMessage.wait();
            setLoading(false);

            // Refresh messages
            await readMessage(address);
        } catch (error) {
            setError("Failed to send message. Please try again.");
        }
    };

    const readUser = async (userAddress) => {
        try {
            const authContract = await connectingWithAuthManager();
            const userName = await authContract.getUserNameByAddress(userAddress);
            setCurrentUserName(userName);
            setCurrentUserAddress(userAddress);
        } catch (error) {
            setError("Failed to read user information");
        }
    };

    return (
        <ChatAppContext.Provider value={{
            account,
            userName,
            friendLists,
            friendMsg,
            loading,
            userLists,
            error,
            readMessage,
            sendMessage,
            readUser,
            currentUserName,
            currentUserAddress,
            CheckIfWalletConnected,
            connectWallet,
        }}>
            {children}
        </ChatAppContext.Provider>
    );
};