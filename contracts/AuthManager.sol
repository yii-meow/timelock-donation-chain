// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuthManager {
    uint256 private constant MAX_NAME_LENGTH = 50;
    uint256 private constant MAX_EMAIL_LENGTH = 100;
    uint256 private constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 private constant MAX_TAGS = 10;
    uint256 private constant MAX_TAG_LENGTH = 20;

    struct UserDetails {
        string name;
        string email;
        uint256 registrationDate;
        bool isActive;
    }

    struct CharityDetails {
        string name;
        string description;
        address payable walletAddress;
        uint256 registrationDate;
        bool isApproved;
        bool isActive;
        uint8 category;
        string[MAX_TAGS] tags;
        uint8 tagCount;
    }

    mapping(address => UserDetails) private users;
    mapping(address => CharityDetails) private charities;
    address public immutable admin;
    address[] private allUsers;
    address[] private allCharities;

    string[] public categories;

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
    event CharityDisapproved(address indexed charityAddress);
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

    error Unauthorized();
    error InvalidInput();
    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyInUse();
    error InvalidState();

    constructor() {
        admin = msg.sender;
        categories = [
            "Education",
            "Healthcare",
            "Environment",
            "Poverty",
            "Disaster Relief",
            "Arts and Culture",
            "Animal Welfare",
            "Human Rights"
        ];
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyRegisteredUser() {
        if (users[msg.sender].registrationDate == 0) revert NotRegistered();
        _;
    }

    modifier onlyRegisteredCharity() {
        if (charities[msg.sender].registrationDate == 0) revert NotRegistered();
        _;
    }

    modifier onlyActiveUser() {
        if (!users[msg.sender].isActive) revert InvalidState();
        _;
    }

    modifier onlyActiveCharity() {
        if (!charities[msg.sender].isActive) revert InvalidState();
        _;
    }

    function registerAsUser(
        string calldata _name,
        string calldata _email
    ) external {
        if (
            bytes(_name).length == 0 ||
            bytes(_name).length > MAX_NAME_LENGTH ||
            bytes(_email).length == 0 ||
            bytes(_email).length > MAX_EMAIL_LENGTH ||
            !isValidEmail(_email) ||
            !isUniqueEmail(_email)
        ) revert InvalidInput();
        if (
            users[msg.sender].registrationDate != 0 ||
            charities[msg.sender].registrationDate != 0
        ) revert AlreadyRegistered();

        users[msg.sender] = UserDetails({
            name: _name,
            email: _email,
            registrationDate: block.timestamp,
            isActive: true
        });

        allUsers.push(msg.sender);

        emit UserRegistered(msg.sender, _name, _email);
    }

    function registerAsCharity(
        string calldata _name,
        string calldata _description,
        address payable _walletAddress,
        uint8 _category,
        string[] calldata _tags
    ) external {
        if (
            bytes(_name).length == 0 ||
            bytes(_name).length > MAX_NAME_LENGTH ||
            bytes(_description).length == 0 ||
            bytes(_description).length > MAX_DESCRIPTION_LENGTH ||
            _walletAddress == address(0) ||
            _category >= categories.length ||
            _tags.length == 0 ||
            _tags.length > MAX_TAGS
        ) revert InvalidInput();
        if (charities[msg.sender].registrationDate != 0)
            revert AlreadyRegistered();
        if (!isUniqueCharityName(_name)) revert AlreadyInUse();

        string[MAX_TAGS] memory tags;
        for (uint8 i = 0; i < _tags.length; i++) {
            if (
                bytes(_tags[i]).length == 0 ||
                bytes(_tags[i]).length > MAX_TAG_LENGTH
            ) revert InvalidInput();
            tags[i] = _tags[i];
        }

        charities[msg.sender] = CharityDetails({
            name: _name,
            description: _description,
            walletAddress: _walletAddress,
            registrationDate: block.timestamp,
            isApproved: false,
            isActive: true,
            category: _category,
            tags: tags,
            tagCount: uint8(_tags.length)
        });

        allCharities.push(msg.sender);

        emit CharityRegistered(
            msg.sender,
            _name,
            _description,
            _category,
            _tags
        );
    }

    function updateUserDetails(
        string calldata _name,
        string calldata _email
    ) external onlyRegisteredUser onlyActiveUser {
        if (
            bytes(_name).length == 0 ||
            bytes(_name).length > MAX_NAME_LENGTH ||
            bytes(_email).length == 0 ||
            bytes(_email).length > MAX_EMAIL_LENGTH ||
            !isValidEmail(_email)
        ) revert InvalidInput();

        if (
            keccak256(bytes(_email)) !=
            keccak256(bytes(users[msg.sender].email)) &&
            !isUniqueEmail(_email)
        ) revert AlreadyInUse();

        users[msg.sender].name = _name;
        users[msg.sender].email = _email;

        emit UserUpdated(msg.sender, _name, _email);
    }

    function updateCharityDetails(
        string calldata _name,
        string calldata _description,
        uint8 _category,
        string[] calldata _tags
    ) external onlyRegisteredCharity onlyActiveCharity {
        if (
            bytes(_name).length == 0 ||
            bytes(_name).length > MAX_NAME_LENGTH ||
            bytes(_description).length == 0 ||
            bytes(_description).length > MAX_DESCRIPTION_LENGTH ||
            _category >= categories.length ||
            _tags.length == 0 ||
            _tags.length > MAX_TAGS
        ) revert InvalidInput();

        CharityDetails storage charity = charities[msg.sender];
        charity.name = _name;
        charity.description = _description;
        charity.category = _category;

        for (uint8 i = 0; i < _tags.length; i++) {
            if (bytes(_tags[i]).length > MAX_TAG_LENGTH) revert InvalidInput();
            charity.tags[i] = _tags[i];
        }
        charity.tagCount = uint8(_tags.length);

        emit CharityUpdated(msg.sender, _name, _description, _category, _tags);
    }

    function toggleUserActivation() external onlyRegisteredUser {
        bool newActiveStatus = !users[msg.sender].isActive;
        users[msg.sender].isActive = newActiveStatus;
        if (newActiveStatus) {
            emit UserReactivated(msg.sender);
        } else {
            emit UserDeactivated(msg.sender);
        }
    }

    function toggleCharityActivation() external onlyRegisteredCharity {
        bool newActiveStatus = !charities[msg.sender].isActive;
        charities[msg.sender].isActive = newActiveStatus;
        if (newActiveStatus) {
            emit CharityReactivated(msg.sender);
        } else {
            emit CharityDeactivated(msg.sender);
        }
    }

    function approveCharity(address _charityAddress) external onlyAdmin {
        if (charities[_charityAddress].registrationDate == 0)
            revert NotRegistered();
        if (charities[_charityAddress].isApproved) revert InvalidState();

        charities[_charityAddress].isApproved = true;
        emit CharityApproved(_charityAddress);
    }

    function disapproveCharity(address _charityAddress) external onlyAdmin {
        if (charities[_charityAddress].registrationDate == 0)
            revert NotRegistered();
        if (!charities[_charityAddress].isApproved) revert InvalidState();

        charities[_charityAddress].isApproved = false;
        emit CharityDisapproved(_charityAddress);
    }

    function getUserDetails()
        external
        view
        onlyRegisteredUser
        returns (
            string memory name,
            string memory email,
            uint256 registrationDate,
            bool isActive
        )
    {
        UserDetails storage user = users[msg.sender];
        return (user.name, user.email, user.registrationDate, user.isActive);
    }

    function getCharityDetails(
        address _charityAddress
    )
        external
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
        if (charities[_charityAddress].registrationDate == 0)
            revert NotRegistered();
        CharityDetails storage charity = charities[_charityAddress];

        string[] memory activeTags = new string[](charity.tagCount);
        for (uint8 i = 0; i < charity.tagCount; i++) {
            activeTags[i] = charity.tags[i];
        }

        return (
            charity.name,
            charity.description,
            charity.walletAddress,
            charity.registrationDate,
            charity.isApproved,
            charity.isActive,
            charity.category,
            activeTags
        );
    }

    function getCategoryName(
        uint8 _categoryId
    ) external view returns (string memory) {
        if (_categoryId >= categories.length) revert InvalidInput();
        return categories[_categoryId];
    }

    function getCategoryCount() external view returns (uint256) {
        return categories.length;
    }

    function isUserRegistered(
        address userAddress
    ) external view returns (bool) {
        return users[userAddress].registrationDate != 0;
    }

    function isCharityRegistered(
        address charityAddress
    ) external view returns (bool) {
        return charities[charityAddress].registrationDate != 0;
    }

    function isCharityApproved(
        address _charityAddress
    ) external view returns (bool) {
        return
            charities[_charityAddress].registrationDate != 0 &&
            charities[_charityAddress].isApproved;
    }

    function getUserNameByAddress(
        address userAddress
    ) external view returns (string memory) {
        if (users[userAddress].registrationDate == 0) revert NotRegistered();
        return users[userAddress].name;
    }

    function isUserActive(address _userAddress) external view returns (bool) {
        if (users[_userAddress].registrationDate == 0) revert NotRegistered();
        return users[_userAddress].isActive;
    }

    function isCharityActive(
        address _charityAddress
    ) external view returns (bool) {
        if (charities[_charityAddress].registrationDate == 0)
            revert NotRegistered();
        return charities[_charityAddress].isActive;
    }

    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    function getAllCharities() external view returns (address[] memory) {
        return allCharities;
    }

    function isAdmin(address _address) external view returns (bool) {
        return admin == _address;
    }

    function getUserCount() external view returns (uint256) {
        return allUsers.length;
    }

    function getCharityCount() external view returns (uint256) {
        return allCharities.length;
    }

    function isValidEmail(string memory email) private pure returns (bool) {
        bytes memory b = bytes(email);
        if (b.length < 3) return false;
        bool foundAtSymbol = false;
        bool foundDotAfterAtSymbol = false;

        for (uint i; i < b.length; i++) {
            if (b[i] == 0x40) {
                foundAtSymbol = true;
            } else if (b[i] == 0x2E && foundAtSymbol) {
                foundDotAfterAtSymbol = true;
            }
        }

        return foundAtSymbol && foundDotAfterAtSymbol;
    }

    function isUniqueEmail(string memory email) private view returns (bool) {
        bytes32 emailHash = keccak256(bytes(email));
        for (uint i = 0; i < allUsers.length; i++) {
            if (keccak256(bytes(users[allUsers[i]].email)) == emailHash) {
                return false;
            }
        }
        return true;
    }

    function isUniqueCharityName(
        string memory name
    ) private view returns (bool) {
        bytes32 nameHash = keccak256(bytes(name));
        for (uint i = 0; i < allCharities.length; i++) {
            if (keccak256(bytes(charities[allCharities[i]].name)) == nameHash) {
                return false;
            }
        }
        return true;
    }
}
