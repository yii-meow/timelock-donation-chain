import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { CheckIfWalletConnected, connectWallet, connectingWithContract } from './apiFeature';

export const ChatAppContext = React.createContext();

export const ChatAppProvider = ({ children }) => {
    // Usesate
    const [account, setAccount] = useState("");
    const [userName, setUserName] = useState("");
    const [friendLists, setFriendLists] = useState([]);
    const [friendMsg, setFriendMsg] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userLists, setUserLists] = useState([]);
    const [error, setError] = useState("");


    //Chat user data
    const [currentUserName, setCurrentUserName] = useState("");
    const [currentUserAddress, setCurrentUserAddress] = useState("");

    const navigate = useNavigate();


    //Fetch data time of page load
    const fetchData = async () => {
        try {
            //get contract
            const contract = await connectingWithContract();

            //get account
            const connectAcount = await connectWallet();
            setAccount(connectAcount);

            //get username
            const userName = await contract.getUserName(connectAcount);
            setUserName(userName);

            //get my friend list
            const friendLists = await contract.getMyFriendList();
            setFriendLists(friendLists);

            //get all app user list
            const userLists = await contract.getAllAppUser();
            setUserLists(userLists);

        } catch (error) {
            //setError("Please install and connect your wallet");
            console.log(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    //read message
    const readMessage = async (friendAddress) => {
        try {
            const contract = await connectingWithContract();
            const read = await contract.readMessage(friendAddress);
            setFriendMsg(read);
        } catch (error) {
            setError("Currently You Do Not Have Any Message");
        }
    };

    //create account
    const createAccount = async ({ name, accountAddress }) => {
        try {
            if (!name || accountAddress)
                return setError("Name And Account Address, cannot be empty");
            const contract = await connectingWithContract();
            const getCreatedUser = await contract.createAccount(name);
            setLoading(true);
            await getCreatedUser.wait();
            setLoading(false);
            window.location.reload();

        } catch (error) {
            setError("Error while creating your account, Please reload browser");
        }
    };

    //Add your friend
    const addFriends = async ({ name, accountAddress }) => {
        try {
            //if(name || accountAddress) return setError("Please provide the Name and Account Address");

            const contract = await connectingWithContract();
            const addMyFriend = await contract.addFriend(accountAddress, name);
            setLoading(true);
            await addMyFriend.wait();
            setLoading(false);
            navigate("/");
            window.location.reload();
        } catch (error) {
            setError("Something went wrong while adding friends, try again");
        }
    };

    //send msg to your friends
    const sendMessage = async ({ msg, address }) => {
        try {
            //if(msg || address) return setError("Please Type Your Message");

            const contract = await connectingWithContract();
            const addMessage = await contract.sendMessage(address, msg);
            setLoading(true);
            await addMessage.wait();
            setLoading(false);
            window.location.reload();
        } catch (error) {
            setError("Please reload and try again");
        }
    };

    //read user info
    const readUser = async (userAddress) => {
        const contract = await connectingWithContract();
        const userName = await contract.getUserName(userAddress);
        setCurrentUserName(userName);
        setCurrentUserAddress(userAddress);
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
            createAccount,
            addFriends,
            sendMessage,
            readUser,
            connectWallet,
            CheckIfWalletConnected,
            currentUserName,
            currentUserAddress,
        }}>
            {children}
        </ChatAppContext.Provider>
    );
};