import { ethers } from "ethers";
import Web3Modal from 'web3modal';


import { Chat_App_ABI } from './abis/ChatApp';
const ChatAppAddress = "0x7019c2E21fAd30FC637fb914610b3cB32A5Fb377";


export const CheckIfWalletConnected = async () => {
    try {
        if (!window.ethereum) return console.log("Install MetaMask");
        const account = await window.ethereum.request({
            method: "eth_account",
        });

        const firstAccount = account[0];
        return firstAccount;

    } catch (error) {
        console.log(error);
    }


};

export const connectWallet = async () => {
    try {
        if (!window.ethereum) return console.log("Install MetaMask");

        const account = await window.ethereum.request({
            method: "eth_requestAccounts",
        });

        const firstAccount = account[0];
        return firstAccount;
    } catch (error) {
        console.log(error);
    }
};

const fetchContract = (signerOrProvider) =>
    new ethers.Contract(ChatAppAddress, Chat_App_ABI, signerOrProvider);

export const connectingWithContract = async () => {
    try {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const contract = fetchContract(signer);

        return contract;
    } catch (error) {
        console.log(error);
    }
};

export const convertTime = (time) => {
    const newTime = new Date(time.toNumber());

    const realTime = newTime.getHours() + "/" + newTime.getMinutes() + "/" + newTime.getSeconds() +
        " Date:" + newTime.getDate() + "/" + (newTime.getMonth() + 1) + "/" +
        newTime.getFullYear();

    return realTime;
};