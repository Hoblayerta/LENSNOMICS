// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CommunityToken is ERC20, Ownable {
    uint256 public constant POST_FEE = 1 * 10**18; // 1 token per post
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address communityOwner
    ) ERC20(name, symbol) Ownable(communityOwner) {
        _mint(communityOwner, initialSupply * 10**18);
    }

    function payPostFee(address poster) external returns (bool) {
        require(balanceOf(poster) >= POST_FEE, "Insufficient tokens for post");
        _transfer(poster, owner(), POST_FEE);
        return true;
    }

    // Optional: Allow community owner to reward active members
    function rewardMember(address member, uint256 amount) external onlyOwner {
        _mint(member, amount);
    }
}
