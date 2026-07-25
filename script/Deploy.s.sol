// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GiwaToken.sol";
import "../src/GiwaLendingPool.sol";
import "../src/KycRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");

        vm.startBroadcast(deployerKey);

        KycRegistry kyc = new KycRegistry();
        GiwaToken token = new GiwaToken();
        GiwaLendingPool pool = new GiwaLendingPool(address(token));

        address deployer = vm.addr(deployerKey);
        kyc.addVerified(deployer);

        vm.stopBroadcast();

        console.log("KycRegistry:      ", address(kyc));
        console.log("GLT Token:        ", address(token));
        console.log("Lending Pool:     ", address(pool));
        console.log("Deployer verified:", deployer);
    }
}
