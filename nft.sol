// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SimpleNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    uint256 public mintPrice = 1000 wei;
    Counters.Counter public tokenIdCounter;

    mapping(address => uint256[]) private _ownedTokens;

    constructor() payable ERC721("Simple NFT", "SNFT") Ownable(msg.sender) {}

    function mint(string memory tokenURI) external payable {
        require(msg.value == mintPrice, "Wrong value");

        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        _ownedTokens[msg.sender].push(tokenId);
    }

    function ownedTokens(address account)
        external
        view
        returns (uint256[] memory)
    {
        return _ownedTokens[account];
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }
}
