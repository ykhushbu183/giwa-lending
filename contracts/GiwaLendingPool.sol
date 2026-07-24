// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDojangScroll {
    function isVerified(address, bytes32) external view returns (bool);
}

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

contract GiwaLendingPool {
    IDojangScroll public dojang = IDojangScroll(0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9);
    bytes32 constant UPBIT_KOREA = 0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034;

    IERC20 public token;
    uint256 public totalDeposits;
    uint256 public totalBorrows;
    uint256 public constant COLLATERAL_RATIO = 150;

    struct UserInfo {
        uint256 deposits;
        uint256 borrows;
        uint256 collateral;
        uint256 depositTime;
        uint256 borrowTime;
    }

    mapping(address => UserInfo) public users;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 interest);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount, uint256 interest);

    constructor(address _token) {
        token = IERC20(_token);
    }

    modifier onlyVerified() {
        require(dojang.isVerified(msg.sender, UPBIT_KOREA), "KYC required");
        _;
    }

    function deposit(uint256 amount) external onlyVerified {
        require(amount > 0, "Zero amount");
        token.transferFrom(msg.sender, address(this), amount);
        users[msg.sender].deposits += amount;
        if (users[msg.sender].depositTime == 0) {
            users[msg.sender].depositTime = block.timestamp;
        }
        totalDeposits += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        UserInfo storage user = users[msg.sender];
        require(user.deposits >= amount, "Insufficient balance");
        uint256 interest = _calculateLendInterest(msg.sender);
        user.deposits -= amount;
        totalDeposits -= amount;
        if (user.deposits == 0) user.depositTime = 0;
        token.transfer(msg.sender, amount + interest);
        emit Withdrawn(msg.sender, amount, interest);
    }

    function borrow(uint256 amount) external onlyVerified {
        UserInfo storage user = users[msg.sender];
        require(user.deposits > 0, "Deposit first");
        uint256 requiredCollateral = (amount * COLLATERAL_RATIO) / 100;
        require(user.deposits >= requiredCollateral, "Insufficient collateral");

        user.borrows += amount;
        user.collateral += requiredCollateral;
        if (user.borrowTime == 0) user.borrowTime = block.timestamp;
        totalBorrows += amount;
        token.transfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        UserInfo storage user = users[msg.sender];
        require(user.borrows >= amount, "Exceeds loan");
        uint256 interest = _calculateBorrowInterest(msg.sender);
        uint256 totalDue = amount + interest;
        token.transferFrom(msg.sender, address(this), totalDue);
        user.borrows -= amount;
        user.collateral = (user.borrows * COLLATERAL_RATIO) / 100;
        totalBorrows -= amount;
        if (user.borrows == 0) user.borrowTime = 0;
        emit Repaid(msg.sender, amount, interest);
    }

    function _calculateLendInterest(address user) internal view returns (uint256) {
        if (users[user].depositTime == 0) return 0;
        uint256 timePassed = block.timestamp - users[user].depositTime;
        return (users[user].deposits * 5 * timePassed) / (365 days * 100);
    }

    function _calculateBorrowInterest(address user) internal view returns (uint256) {
        if (users[user].borrowTime == 0) return 0;
        uint256 timePassed = block.timestamp - users[user].borrowTime;
        return (users[user].borrows * 10 * timePassed) / (365 days * 100);
    }

    function getPoolStats() external view returns (uint256, uint256, uint256) {
        uint256 utilization = totalDeposits == 0 ? 0 : (totalBorrows * 100) / totalDeposits;
        return (totalDeposits, totalBorrows, utilization);
    }

    function getUserInfo(address user) external view returns (uint256, uint256, uint256, uint256, uint256) {
        UserInfo storage u = users[user];
        return (u.deposits, u.borrows, u.collateral, _calculateLendInterest(user), _calculateBorrowInterest(user));
    }
}
