// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KycRegistry {
    address public owner;
    mapping(address => bool) public verified;
    uint256 public totalVerified;

    event VerifiedAdded(address indexed user);
    event VerifiedRemoved(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addVerified(address user) external onlyOwner {
        require(!verified[user], "Already verified");
        verified[user] = true;
        totalVerified++;
        emit VerifiedAdded(user);
    }

    function addBatch(address[] calldata users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            if (!verified[users[i]]) {
                verified[users[i]] = true;
                totalVerified++;
                emit VerifiedAdded(users[i]);
            }
        }
    }

    function removeVerified(address user) external onlyOwner {
        require(verified[user], "Not verified");
        verified[user] = false;
        totalVerified--;
        emit VerifiedRemoved(user);
    }

    function isVerified(address user) external view returns (bool) {
        return verified[user];
    }
}
