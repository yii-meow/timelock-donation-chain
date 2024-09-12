// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserAuth {
    struct UserDetails {
        string name;
        string email;
        uint256 registrationDate;
        bool exists;
    }

    mapping(address => UserDetails) private users;

    event UserRegistered(
        address indexed userAddress,
        string name,
        string email
    );

    modifier onlyRegistered() {
        require(users[msg.sender].exists, "User not registered");
        _;
    }

    function register(string memory _name, string memory _email) public {
        require(!users[msg.sender].exists, "User already registered");

        users[msg.sender] = UserDetails({
            name: _name,
            email: _email,
            registrationDate: block.timestamp,
            exists: true
        });

        emit UserRegistered(msg.sender, _name, _email);
    }

    function getUserDetails()
        public
        view
        onlyRegistered
        returns (
            string memory name,
            string memory email,
            uint256 registrationDate
        )
    {
        UserDetails memory user = users[msg.sender];
        return (user.name, user.email, user.registrationDate);
    }

    function isUserRegistered(address userAddress) public view returns (bool) {
        return users[userAddress].exists;
    }
}
