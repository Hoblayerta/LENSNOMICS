// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CommunityToken.sol";

contract CommunityTokenFactory {
    event CommunityTokenCreated(address indexed tokenAddress, string name, string symbol, address indexed creator);

    function createCommunityToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external returns (address) {
        CommunityToken newToken = new CommunityToken(
            name,
            symbol,
            initialSupply,
            msg.sender
        );
        
        emit CommunityTokenCreated(address(newToken), name, symbol, msg.sender);
        return address(newToken);
    }
}
