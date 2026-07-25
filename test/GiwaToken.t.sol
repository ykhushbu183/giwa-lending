// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/GiwaToken.sol";

contract GiwaTokenTest is Test {
    GiwaToken token;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        token = new GiwaToken();
    }

    function test_Mint() public {
        vm.prank(alice);
        token.mint(100 ether);

        assertEq(token.balanceOf(alice), 100 ether);
        assertEq(token.totalSupply(), 100 ether);
    }

    function test_Transfer() public {
        vm.prank(alice);
        token.mint(50 ether);

        vm.prank(alice);
        token.transfer(bob, 20 ether);

        assertEq(token.balanceOf(alice), 30 ether);
        assertEq(token.balanceOf(bob), 20 ether);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(alice);
        token.mint(100 ether);

        vm.prank(alice);
        token.approve(bob, 50 ether);

        vm.prank(bob);
        token.transferFrom(alice, bob, 30 ether);

        assertEq(token.balanceOf(alice), 70 ether);
        assertEq(token.balanceOf(bob), 30 ether);
        assertEq(token.allowance(alice, bob), 20 ether);
    }

    function test_Symbol() public view {
        assertEq(token.symbol(), "GLT");
        assertEq(token.name(), "GiwaLend Token");
        assertEq(token.decimals(), 18);
    }

    function testFuzz_Mint(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 1_000_000 ether);
        vm.prank(alice);
        token.mint(amount);

        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), amount);
    }
}
