// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuthManager {
    struct UserDetails {
        string name;
        string email;
        uint256 registrationDate;
        bool exists;
        bool isActive;
    }

    struct CharityDetails {
        string name;
        string description;
        address payable walletAddress;
        uint256 registrationDate;
        bool exists;
        bool isApproved;
        bool isActive;
        uint8 category;
        string[] tags;
    }

    mapping(address => UserDetails) private users;
    mapping(address => CharityDetails) private charities;
    address public admin;

    string[] public categories = [
        "Education",
        "Healthcare",
        "Environment",
        "Poverty",
        "Disaster Relief",
        "Arts and Culture",
        "Animal Welfare",
        "Human Rights"
    ];

    event UserRegistered(
        address indexed userAddress,
        string name,
        string email
    );
    event CharityRegistered(
        address indexed charityAddress,
        string name,
        string description,
        uint8 category,
        string[] tags
    );
    event CharityApproved(address indexed charityAddress);
    event UserUpdated(address indexed userAddress, string name, string email);
    event CharityUpdated(
        address indexed charityAddress,
        string name,
        string description,
        uint8 category,
        string[] tags
    );
    event UserDeactivated(address indexed userAddress);
    event CharityDeactivated(address indexed charityAddress);
    event UserReactivated(address indexed userAddress);
    event CharityReactivated(address indexed charityAddress);

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

    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "User is not active");
        _;
    }

    modifier onlyActiveCharity() {
        require(charities[msg.sender].isActive, "Charity is not active");
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
            exists: true,
            isActive: true
        });

        emit UserRegistered(msg.sender, _name, _email);
    }

    function registerAsCharity(
        string memory _name,
        string memory _description,
        address payable _walletAddress,
        uint8 _category,
        string[] memory _tags
    ) public {
        require(!charities[msg.sender].exists, "Charity already registered");
        require(_category < categories.length, "Invalid category");

        charities[msg.sender] = CharityDetails({
            name: _name,
            description: _description,
            walletAddress: _walletAddress,
            registrationDate: block.timestamp,
            exists: true,
            isApproved: false,
            isActive: true,
            category: _category,
            tags: _tags
        });

        emit CharityRegistered(
            msg.sender,
            _name,
            _description,
            _category,
            _tags
        );
    }

    function updateUserDetails(
        string memory _name,
        string memory _email
    ) public onlyRegisteredUser onlyActiveUser {
        UserDetails storage user = users[msg.sender];
        user.name = _name;
        user.email = _email;

        emit UserUpdated(msg.sender, _name, _email);
    }

    function updateCharityDetails(
        string memory _name,
        string memory _description,
        uint8 _category,
        string[] memory _tags
    ) public onlyRegisteredCharity onlyActiveCharity {
        require(_category < categories.length, "Invalid category");

        CharityDetails storage charity = charities[msg.sender];
        charity.name = _name;
        charity.description = _description;
        charity.category = _category;
        charity.tags = _tags;

        emit CharityUpdated(msg.sender, _name, _description, _category, _tags);
    }

    function deactivateUser() public onlyRegisteredUser {
        users[msg.sender].isActive = false;
        emit UserDeactivated(msg.sender);
    }

    function deactivateCharity() public onlyRegisteredCharity {
        charities[msg.sender].isActive = false;
        emit CharityDeactivated(msg.sender);
    }

    function reactivateUser() public onlyRegisteredUser {
        users[msg.sender].isActive = true;
        emit UserReactivated(msg.sender);
    }

    function reactivateCharity() public onlyRegisteredCharity {
        charities[msg.sender].isActive = true;
        emit CharityReactivated(msg.sender);
    }

    function approveCharity(address _charityAddress) public onlyAdmin {
        require(charities[_charityAddress].exists, "Charity not registered");
        require(
            !charities[_charityAddress].isApproved,
            "Charity already approved"
        );

        charities[_charityAddress].isApproved = true;
        emit CharityApproved(_charityAddress);
    }

    function getUserDetails()
        public
        view
        onlyRegisteredUser
        returns (
            string memory name,
            string memory email,
            uint256 registrationDate,
            bool isActive
        )
    {
        UserDetails memory user = users[msg.sender];
        return (user.name, user.email, user.registrationDate, user.isActive);
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
            bool isApproved,
            bool isActive,
            uint8 category,
            string[] memory tags
        )
    {
        require(charities[_charityAddress].exists, "Charity does not exist");
        CharityDetails memory charity = charities[_charityAddress];
        return (
            charity.name,
            charity.description,
            charity.walletAddress,
            charity.registrationDate,
            charity.isApproved,
            charity.isActive,
            charity.category,
            charity.tags
        );
    }

    function getCategoryName(
        uint8 _categoryId
    ) public view returns (string memory) {
        require(_categoryId < categories.length, "Invalid category ID");
        return categories[_categoryId];
    }

    function getCategoryCount() public view returns (uint256) {
        return categories.length;
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
