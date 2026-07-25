// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GiwaToken.sol";
import "../src/GiwaLendingPool.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");

        vm.startBroadcast(deployerKey);

        GiwaToken token = new GiwaToken();
        GiwaLendingPool pool = new GiwaLendingPool(address(token));

        vm.stopBroadcast();

        console.log("GLT Token:        ", address(token));
        console.log("Lending Pool:     ", address(pool));
    }
}
