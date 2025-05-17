// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Tokenzinho is ERC20, Ownable {
    using Counters for Counters.Counter;

    struct Loan {
        uint64 deadline;
        uint256 amount;
        uint64 periodicity;
        uint16 interest;
        uint16 termination;
        address lender;
        address borrower;
        bool isBasedNft;
        address nftContract;
        uint256 nftId;
    }

    Counters.Counter loanIds;

    uint64 maxLoanDuration;
    // uint256 balance; // i think we don't need this, we can use address(this).balance to get contract's balance
    uint256 dexSwapRate;

    mapping(uint256 => Loan) loans;

    constructor(uint256 rate) payable ERC20("Tokenzinho", "TKZ") Ownable(msg.sender) {
        require(rate > 0, "Rate must be greater than 0");
        // dexSwapRate =  rate * 10 ** 18; // 1 ETH = 10**18 Wei - ETH rate
        dexSwapRate = rate; // Wei rate
        _mint(address(this), 10 ** 18);
    }

    function buyDex() external payable {
        require(msg.value > 0, "Value must be greater than 0");
        require(balanceOf(address(this)) > msg.value / dexSwapRate, "Contract doesn't have enough TKZ");
        uint256 dexAmount = msg.value / dexSwapRate;
        if (dexAmount > 0) {
            _transfer(address(this), msg.sender, dexAmount);
            uint256 weiRefundAmount = msg.value - dexAmount * dexSwapRate;
            if (weiRefundAmount > 0) {
                payable(msg.sender).transfer(weiRefundAmount);
            }
        }
    }

    function sellDex(uint256 dexAmount) external {
        require(dexAmount > 0, "Value must be greater than 0");
        require(balanceOf(msg.sender) >= dexAmount, "You don't have that amount of TKZ");
        require(address(this).balance >= dexAmount * dexSwapRate, "Contract doesn't have enough ETH");
        _transfer(msg.sender, address(this), dexAmount);
        payable(msg.sender).transfer(dexAmount * dexSwapRate);
    }

    function loan(uint256 dexAmount, uint256 deadline) external {
        // TODO
    }

    function returnLoan(uint256 loanId) external payable {
        // TODO
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getDexBalance() external view returns (uint256) {
        return balanceOf(address(msg.sender));
    }

    function makeLoanRequestByNft(IERC721 nftContract, uint256 nftId, uint256 loanAmount, uint256 deadline) external {
        // TODO
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO
    }

    function checkLoan(uint256 loanId) external{
        // TODO
    }

    event loanCreated(address borrower, uint256 amount, uint256 deadline);
}
