// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuthManager {
    function isCharityApproved(
        address _charityAddress
    ) external view returns (bool);
    function isUserActive(address _userAddress) external view returns (bool);
}

contract CombinedTimeLock {
    IAuthManager public authManager;

    enum TransactionType {
        Scheduled,
        Instant,
        Modify,
        Cancel
    }

    struct Transaction {
        TransactionType txType;
        address beneficiary;
        address creator;
        uint256 amount;
        uint256 releaseTime; // For scheduled transactions
        bool executed;
        uint256 approvals;
        bool isModified;
    }

    mapping(uint256 => Transaction) public transactions;
    uint256 public transactionCount;

    address public owner;
    uint public delay;
    uint public requiredSignatures;

    address[] public signatories;

    mapping(uint256 => mapping(address => bool)) public approvals;

    event TransactionCreated(
        uint256 indexed transactionId,
        TransactionType txType,
        address indexed beneficiary,
        uint256 amount,
        uint256 releaseTime
    );
    event TransactionExecuted(uint256 indexed transactionId);
    event TransactionCancelled(uint256 indexed transactionId);
    event TransactionModified(
        uint256 indexed transactionId,
        address indexed newBeneficiary,
        uint256 newAmount,
        uint256 newReleaseTime
    );
    event TransactionApproved(
        uint256 indexed transactionId,
        address indexed approver
    );

    modifier onlyCreator(uint256 transactionId) {
        require(
            msg.sender == transactions[transactionId].creator,
            "Not the transaction creator"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlySignatory() {
        require(isSignatory(msg.sender), "Not a signatory");
        _;
    }

    constructor(
        address[] memory _signatories,
        uint _delay,
        uint _requiredSignatures,
        address _authManagerAddress
    ) {
        require(
            _requiredSignatures <= _signatories.length,
            "Invalid signature requirement"
        );
        owner = msg.sender;
        signatories = _signatories;
        delay = _delay;
        requiredSignatures = _requiredSignatures;
        authManager = IAuthManager(_authManagerAddress);
    }

    function isSignatory(address _addr) public view returns (bool) {
        for (uint i = 0; i < signatories.length; i++) {
            if (signatories[i] == _addr) {
                return true;
            }
        }
        return false;
    }

    function viewTransaction(
        uint256 transactionId
    )
        external
        view
        returns (
            TransactionType,
            address,
            uint256,
            uint256,
            bool,
            uint256,
            bool
        )
    {
        Transaction storage transaction = transactions[transactionId];
        return (
            transaction.txType,
            transaction.beneficiary,
            transaction.amount,
            transaction.releaseTime,
            transaction.executed,
            transaction.approvals,
            transaction.isModified
        );
    }

    // Queue a scheduled transaction with an input amount
    function queueTransaction(
        address beneficiary,
        uint256 amount,
        uint256 releaseTime
    ) external returns (uint256) {
        require(
            authManager.isUserActive(msg.sender),
            "Sender is not an active user"
        );
        require(
            authManager.isCharityApproved(beneficiary),
            "Beneficiary is not an approved charity"
        );
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(amount > 0, "Amount must be greater than zero");
        require(
            releaseTime > block.timestamp,
            "Release time must be in the future"
        );

        transactionCount++;
        transactions[transactionCount] = Transaction({
            txType: TransactionType.Scheduled,
            beneficiary: beneficiary,
            creator: msg.sender,
            amount: amount,
            releaseTime: releaseTime,
            executed: false,
            approvals: 0,
            isModified: false
        });

        emit TransactionCreated(
            transactionCount,
            TransactionType.Scheduled,
            beneficiary,
            amount,
            releaseTime
        );
        return transactionCount;
    }

    // Queue an instant transfer with an input amount
    function queueInstantTransfer(
        address beneficiary,
        uint256 amount
    ) external returns (uint256) {
        require(
            authManager.isUserActive(msg.sender),
            "Sender is not an active user"
        );
        require(
            authManager.isCharityApproved(beneficiary),
            "Beneficiary is not an approved charity"
        );
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(amount > 0, "Amount must be greater than zero");

        transactionCount++;
        transactions[transactionCount] = Transaction({
            txType: TransactionType.Instant,
            beneficiary: beneficiary,
            creator: msg.sender,
            amount: amount,
            releaseTime: block.timestamp,
            executed: false,
            approvals: 0,
            isModified: false
        });

        emit TransactionCreated(
            transactionCount,
            TransactionType.Instant,
            beneficiary,
            amount,
            block.timestamp
        );
        return transactionCount;
    }

    // Approve a transaction (instant, scheduled, modification, or cancellation)
    function approveTransaction(uint256 transactionId) external onlySignatory {
        require(
            authManager.isUserActive(msg.sender),
            "Sender is not an active user"
        );
        require(
            !transactions[transactionId].executed,
            "Transaction already executed"
        );
        require(!approvals[transactionId][msg.sender], "Already approved");
        require(
            transactions[transactionId].approvals < requiredSignatures,
            "Already fully approved"
        );

        approvals[transactionId][msg.sender] = true;
        transactions[transactionId].approvals++;

        emit TransactionApproved(transactionId, msg.sender);
    }

    // Modify a transaction (requires approval again after modification)
    function modifyTransaction(
        uint256 transactionId,
        address newBeneficiary,
        uint256 newAmount,
        uint256 newReleaseTime
    ) external onlyCreator(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(
            transaction.txType != TransactionType.Cancel,
            "Cannot modify a canceled transaction"
        );
        require(
            block.timestamp < transaction.releaseTime,
            "Cannot modify after release time"
        );
        require(newBeneficiary != address(0), "Invalid beneficiary");
        require(newAmount > 0, "Amount must be greater than zero");
        require(
            newReleaseTime > block.timestamp,
            "Release time must be in the future"
        );

        // Update the transaction with the new values
        transaction.txType = TransactionType.Modify;
        transaction.beneficiary = newBeneficiary;
        transaction.amount = newAmount;
        transaction.releaseTime = newReleaseTime;
        transaction.isModified = true;

        // Reset approvals for modification
        transaction.approvals = 0;

        // Clear previous approvals
        for (uint i = 0; i < signatories.length; i++) {
            approvals[transactionId][signatories[i]] = false;
        }

        emit TransactionModified(
            transactionId,
            newBeneficiary,
            newAmount,
            newReleaseTime
        );
    }

    // Cancel a transaction (requires approval)
    function cancelTransaction(
        uint256 transactionId
    ) external onlyCreator(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        require(!transaction.executed, "Transaction already executed");
        require(
            block.timestamp < transaction.releaseTime,
            "Cannot cancel after release time"
        );

        transaction.txType = TransactionType.Cancel;
        transaction.approvals = 0; // Reset approvals for cancellation

        emit TransactionCancelled(transactionId);
    }

    // Execute a transaction if the release time has arrived and approvals are met
    function executeTransaction(uint256 transactionId) external payable {
        Transaction storage transaction = transactions[transactionId];
        require(
            block.timestamp >= transaction.releaseTime,
            "Release time has not arrived"
        );
        require(
            transaction.approvals >= requiredSignatures,
            "Not enough approvals"
        );
        require(!transaction.executed, "Transaction already executed");
        require(
            msg.value == transaction.amount,
            "Transaction value must match the specified amount"
        );

        transaction.executed = true;
        payable(transaction.beneficiary).transfer(transaction.amount);

        emit TransactionExecuted(transactionId);
    }

    receive() external payable {}
}
