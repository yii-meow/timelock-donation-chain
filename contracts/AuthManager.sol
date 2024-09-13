// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuthManager {
    struct UserDetails {
        string name;
        string email;
        uint256 registrationDate;
        bool exists;
    }

    struct CharityDetails {
        string name;
        string description;
        address payable walletAddress;
        uint256 registrationDate;
        bool exists;
        bool isApproved;
    }

    mapping(address => UserDetails) private users;
    mapping(address => CharityDetails) private charities;
    address public admin;

    event UserRegistered(
        address indexed userAddress,
        string name,
        string email
    );
    event CharityRegistered(
        address indexed charityAddress,
        string name,
        string description
    );
    event CharityApproved(address indexed charityAddress);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredUser() {
        require(users[msg.sender].exists, "User not registered");
        _;
    }

    modifier onlyRegisteredCharity() {
        require(charities[msg.sender].exists, "Charity not registered");
        _;
    }

    function registerAsUser(string memory _name, string memory _email) public {
        require(!users[msg.sender].exists, "User already registered!");
        require(
            !charities[msg.sender].exists,
            "This address has been registered as charity!"
        );

        users[msg.sender] = UserDetails({
            name: _name,
            email: _email,
            registrationDate: block.timestamp,
            exists: true
        });

        emit UserRegistered(msg.sender, _name, _email);
    }

    function registerAsCharity(
        string memory _name,
        string memory _description,
        address payable _walletAddress
    ) public {
        require(!charities[msg.sender].exists, "Charity already registered");

        charities[msg.sender] = CharityDetails({
            name: _name,
            description: _description,
            walletAddress: _walletAddress,
            registrationDate: block.timestamp,
            exists: true,
            isApproved: false
        });

        emit CharityRegistered(msg.sender, _name, _description);
    }

    // function approveCharity(address _charityAddress) public onlyAdmin {
    //     require(charities[_charityAddress].exists, "Charity not registered");
    //     require(
    //         !charities[_charityAddress].isApproved,
    //         "Charity already approved"
    //     );

    //     charities[_charityAddress].isApproved = true;
    //     emit CharityApproved(_charityAddress);
    // }

    function getUserDetails()
        public
        view
        onlyRegisteredUser
        returns (
            string memory name,
            string memory email,
            uint256 registrationDate
        )
    {
        UserDetails memory user = users[msg.sender];
        return (user.name, user.email, user.registrationDate);
    }

    function getCharityDetails(
        address _charityAddress
    )
        public
        view
        returns (
            string memory name,
            string memory description,
            address walletAddress,
            uint256 registrationDate,
            bool isApproved
        )
    {
        require(charities[_charityAddress].exists, "Charity does not exist");
        CharityDetails memory charity = charities[_charityAddress];
        return (
            charity.name,
            charity.description,
            charity.walletAddress,
            charity.registrationDate,
            charity.isApproved
        );
    }

    function isUserRegistered(address userAddress) public view returns (bool) {
        return users[userAddress].exists;
    }

    function isCharityRegistered(
        address charityAddress
    ) public view returns (bool) {
        return charities[charityAddress].exists;
    }

    function isCharityApproved(
        address charityAddress
    ) public view returns (bool) {
        return charities[charityAddress].isApproved;
    }
}
