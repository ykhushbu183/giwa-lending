// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
}

contract GiwaLendingPool {
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

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(token.transferFrom(msg.sender, address(this), amount));
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
        require(user.deposits - amount >= user.collateral, "Undercollateralized");
        uint256 interest = _calculateLendInterest(msg.sender);
        user.deposits -= amount;
        totalDeposits -= amount;
        if (user.deposits == 0) {
            user.depositTime = 0;
        } else {
            user.depositTime = block.timestamp;
        }
        require(token.transfer(msg.sender, amount + interest));
        emit Withdrawn(msg.sender, amount, interest);
    }

    function borrow(uint256 amount) external {
        UserInfo storage user = users[msg.sender];
        require(user.deposits > 0, "Deposit first");
        uint256 requiredCollateral = (amount * COLLATERAL_RATIO) / 100;
        require(user.deposits >= user.collateral + requiredCollateral, "Insufficient collateral");

        user.borrows += amount;
        user.collateral += requiredCollateral;
        if (user.borrowTime == 0) user.borrowTime = block.timestamp;
        totalBorrows += amount;
        require(token.transfer(msg.sender, amount));
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        UserInfo storage user = users[msg.sender];
        require(user.borrows >= amount, "Exceeds loan");
        uint256 interest = _calculateBorrowInterest(msg.sender);
        uint256 totalDue = amount + interest;
        require(token.transferFrom(msg.sender, address(this), totalDue));
        user.borrows -= amount;
        user.collateral = (user.borrows * COLLATERAL_RATIO) / 100;
        totalBorrows -= amount;
        if (user.borrows == 0) {
            user.borrowTime = 0;
        } else {
            user.borrowTime = block.timestamp;
        }
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
