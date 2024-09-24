// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "./AuthManager.sol";

contract ChatApp {
    AuthManager public authManager;

    constructor(address _authManagerAddress) {
        authManager = AuthManager(_authManagerAddress);
    }

    struct Friend {
        address pubkey;
        string name;
    }

    struct Message {
        address sender;
        uint256 timestamp;
        string msg;
    }

    mapping(address => Friend[]) private friendLists;
    mapping(bytes32 => Message[]) private allMessages;

    event FriendAdded(
        address indexed user,
        address indexed friend,
        string name
    );

    function addFriend(address friend_key, string calldata name) external {
        require(
            authManager.isUserRegistered(msg.sender),
            "Create an account first"
        );
        require(
            authManager.isUserRegistered(friend_key),
            "User is not registered!"
        );
        require(
            authManager.isUserActive(msg.sender),
            "Your account is not active"
        );
        require(
            authManager.isUserActive(friend_key),
            "Friend's account is not active"
        );
        require(
            msg.sender != friend_key,
            "Users cannot add themselves as friends"
        );
        require(
            !checkAlreadyFriends(msg.sender, friend_key),
            "These users are already friends"
        );

        _addFriend(msg.sender, friend_key, name);
        _addFriend(
            friend_key,
            msg.sender,
            authManager.getUserNameByAddress(msg.sender)
        );

        emit FriendAdded(msg.sender, friend_key, name);
    }

    function checkAlreadyFriends(
        address pubkey1,
        address pubkey2
    ) internal view returns (bool) {
        Friend[] memory friends = friendLists[pubkey1];
        for (uint i = 0; i < friends.length; i++) {
            if (friends[i].pubkey == pubkey2) return true;
        }
        return false;
    }

    function _addFriend(
        address me,
        address friend_key,
        string memory name
    ) internal {
        Friend memory newFriend = Friend(friend_key, name);
        friendLists[me].push(newFriend);
    }

    function getMyFriendList() external view returns (Friend[] memory) {
        return friendLists[msg.sender];
    }

    function _getChatCode(
        address pubkey1,
        address pubkey2
    ) internal pure returns (bytes32) {
        if (pubkey1 < pubkey2) {
            return keccak256(abi.encodePacked(pubkey1, pubkey2));
        } else return keccak256(abi.encodePacked(pubkey2, pubkey1));
    }

    function sendMessage(address friend_key, string calldata _msg) external {
        require(
            authManager.isUserRegistered(msg.sender),
            "Create an account first"
        );
        require(
            authManager.isUserRegistered(friend_key),
            "User is not registered"
        );
        require(
            authManager.isUserActive(msg.sender),
            "Your account is not active"
        );
        require(
            authManager.isUserActive(friend_key),
            "Friend's account is not active"
        );
        require(
            checkAlreadyFriends(msg.sender, friend_key),
            "You are not friend with the given user"
        );

        bytes32 chatCode = _getChatCode(msg.sender, friend_key);
        Message memory newMsg = Message(msg.sender, block.timestamp, _msg);
        allMessages[chatCode].push(newMsg);
    }

    function readMessage(
        address friend_key
    ) external view returns (Message[] memory) {
        bytes32 chatCode = _getChatCode(msg.sender, friend_key);
        return allMessages[chatCode];
    }

    function getAllAppUsers() public view returns (address[] memory) {
        return authManager.getAllUsers();
    }
}
