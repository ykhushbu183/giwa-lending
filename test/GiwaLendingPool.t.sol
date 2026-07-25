// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GiwaToken.sol";
import "../src/GiwaLendingPool.sol";

contract GiwaLendingPoolTest is Test {
    GiwaToken token;
    GiwaLendingPool pool;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new GiwaToken();
        pool = new GiwaLendingPool(address(token));

        vm.prank(alice);
        token.mint(1000 ether);

        vm.prank(alice);
        token.approve(address(pool), type(uint256).max);
    }

    function test_Deposit() public {
        vm.prank(alice);
        pool.deposit(100 ether);

        (uint256 deposits,,,,) = pool.getUserInfo(alice);
        assertEq(deposits, 100 ether);
        assertEq(pool.totalDeposits(), 100 ether);
    }

    function test_Withdraw() public {
        vm.prank(alice);
        pool.deposit(100 ether);

        vm.prank(alice);
        pool.withdraw(50 ether);

        (uint256 deposits,,,,) = pool.getUserInfo(alice);
        assertEq(deposits, 50 ether);
    }

    function test_Borrow() public {
        vm.prank(alice);
        pool.deposit(300 ether);

        vm.prank(alice);
        pool.borrow(100 ether);

        (, uint256 borrows, uint256 collateral,,) = pool.getUserInfo(alice);
        assertEq(borrows, 100 ether);
        assertEq(collateral, 150 ether);
        assertEq(pool.totalBorrows(), 100 ether);
        assertEq(token.balanceOf(alice), 800 ether);
    }

    function test_Repay() public {
        vm.prank(alice);
        pool.deposit(300 ether);

        vm.prank(alice);
        pool.borrow(100 ether);

        vm.prank(alice);
        token.mint(100 ether);

        vm.prank(alice);
        token.approve(address(pool), type(uint256).max);

        vm.prank(alice);
        pool.repay(100 ether);

        (, uint256 borrows, uint256 collateral,,) = pool.getUserInfo(alice);
        assertEq(borrows, 0);
        assertEq(collateral, 0);
    }

    function test_RevertBorrow_InsufficientCollateral() public {
        vm.prank(alice);
        pool.deposit(100 ether);

        vm.prank(alice);
        vm.expectRevert("Insufficient collateral");
        pool.borrow(100 ether);
    }

    function test_RevertWithdraw_ExceedsDeposit() public {
        vm.expectRevert("Insufficient balance");
        vm.prank(alice);
        pool.withdraw(1 ether);
    }

    function test_GetPoolStats() public {
        vm.prank(alice);
        pool.deposit(200 ether);

        vm.prank(alice);
        pool.borrow(100 ether);

        (uint256 td, uint256 tb, uint256 util) = pool.getPoolStats();
        assertEq(td, 200 ether);
        assertEq(tb, 100 ether);
        assertEq(util, 50);
    }
}
