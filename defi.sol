// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DecentralizedFinance is ERC20, Ownable {

    // TODO: Review types (for optimization)
    struct Loan {
        uint256 deadline;
        uint256 amount;
        address lender;
        address borrower;
        bool isBasedNft;
        address nftContract;
        uint256 nftId;
    }

    // TODO: Review types & visibility modifiers (for optimization)
    uint256 public dexSwapRate;
    uint256 public periodicity;
    uint256 public interest;
    uint256 public termination;
    uint256 public maxLoanDuration;
    // uint256 balance; // i think we don't need this, we can use address(this).balance to get contract's balance
    
    mapping(uint256 => Loan) loans;

    event loanCreated(
        address indexed borrower,
        uint256 amount,
        uint256 deadline
    );

    constructor(
        uint256 rate,
        uint256 periodicity_,
        uint256 interest_,
        uint256 termination_
    ) ERC20("DEX", "DEX") Ownable(msg.sender) {
        require(rate > 0, "Rate must be greater than 0");
        // dexSwapRate =  rate * 10 ** 18; // 1 ETH = 10**18 Wei - ETH rate
        dexSwapRate = rate; // Wei rate
        periodicity = periodicity_;
        interest = interest_;
        termination = termination_;
        _mint(address(this), 10**18);
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
        // TODO: implement this

        // emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function returnLoan(uint256 ethAmount) external {
        // TODO: implement this
    }

    function getBalance() public view returns (uint256) {
        // TODO: implement this
    }

    function setDexSwapRate(uint256 rate) external {
        // TODO: implement this
    }

    function getDexBalance() public view returns (uint256) {
        // TODO: implement this
    }

    function makeLoanRequestByNft(
        IERC721 nftContract,
        uint256 nftId,
        uint256 loanAmount,
        uint256 deadline
    ) external {
        // TODO: implement this
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId)
        external
    {
        // TODO: implement this
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this

        // emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function checkLoan(uint256 loanId) external {
        // TODO: implement this
    }
}
