// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DecentralizedFinance is ERC20, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private loanIdCounter;

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

        dexSwapRate = rate;
        periodicity = periodicity_;
        interest = interest_;
        termination = termination_;
        maxLoanDuration = 4 weeks;

        _mint(address(this), 10**18);
    }

    function buyDex() external payable {
        require(msg.value > 0, "Value must be greater than 0");

        uint256 dexAmount = msg.value / dexSwapRate;

        require(dexAmount > 0, "DEX amount must be greater than 0");
        require(
            balanceOf(address(this)) >= dexAmount,
            "Contract doesn't have enough DEX"
        );

        _transfer(address(this), msg.sender, dexAmount);

        uint256 weiRefundAmount = msg.value - dexAmount * dexSwapRate;

        if (weiRefundAmount > 0) {
            payable(msg.sender).transfer(weiRefundAmount);
        }
    }

    function sellDex(uint256 dexAmount) external {
        require(dexAmount > 0, "Value must be greater than 0");
        require(
            balanceOf(msg.sender) >= dexAmount,
            "You don't have that amount of DEX"
        );

        uint256 weiAmount = dexAmount * dexSwapRate;

        require(
            address(this).balance >= weiAmount,
            "Contract doesn't have enough ETH"
        );

        _transfer(msg.sender, address(this), dexAmount);
        payable(msg.sender).transfer(weiAmount);
    }

    function loan(uint256 dexAmount, uint256 deadline)
        external
        returns (uint256)
    {
        require(dexAmount > 0, "Value must be greater than 0");
        require(
            deadline > block.timestamp,
            "Deadline must be greater than now"
        );
        require(
            deadline <= block.timestamp + maxLoanDuration,
            "Maximum duration of the loan cannot exceed 4 weeks"
        );
        require(balanceOf(msg.sender) >= dexAmount, "You don't have enough DEX");

        uint256 weiAmount = dexAmount * dexSwapRate;

        require(
            address(this).balance >= weiAmount,
            "Contract doesn't have enough ETH"
        );

        uint256 id = loanIdCounter.current();

        loans[id] = Loan({
            deadline: deadline,
            amount: weiAmount,
            lender: address(this),
            borrower: msg.sender,
            isBasedNft: false,
            nftContract: address(0),
            nftId: 0
        });

        loanIdCounter.increment();

        _transfer(msg.sender, address(this), dexAmount);
        payable(msg.sender).transfer(weiAmount);

        emit loanCreated(msg.sender, weiAmount, deadline);

        return id;
    }

    function returnLoan(uint256 ethAmount) external {
        // TODO: implement this
    }

    function getBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function setDexSwapRate(uint256 rate) external onlyOwner {
        require(rate > 0, "Rate must be greater than 0");
        dexSwapRate = rate;
    }

    function getDexBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }

    function makeLoanRequestByNft(
        IERC721 nftContract,
        uint256 nftId,
        uint256 loanAmount,
        uint256 deadline
    ) external returns (uint256) {
        require(loanAmount > 0, "Value must be greater than 0");
        require(
            deadline > block.timestamp,
            "Deadline must be greater than now"
        );
        require(
            deadline <= block.timestamp + maxLoanDuration,
            "Maximum duration of the loan cannot exceed 4 weeks"
        );
        require(
            nftContract.ownerOf(nftId) == msg.sender,
            "You're not the owner of the NFT"
        );

        uint256 id = loanIdCounter.current();

        loans[id] = Loan({
            deadline: deadline,
            amount: loanAmount,
            lender: address(0),
            borrower: msg.sender,
            isBasedNft: false,
            nftContract: address(nftContract),
            nftId: nftId
        });

        loanIdCounter.increment();

        nftContract.transferFrom(msg.sender, address(this), nftId);

        return id;
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId)
        external
    {
        uint256 id = getLoanIdByNft(nftContract, nftId);

        require(
            loans[id].borrower == msg.sender,
            "You're not the borrower of that loan"
        );
        require(
            loans[id].lender == address(0),
            "There's already a lender for that loan"
        );

        delete loans[id];

        nftContract.transferFrom(address(this), msg.sender, nftId);
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external {
        // TODO: implement this

        // emit loanCreated(msg.sender, loanAmount, deadline);
    }

    function getLoanIdByNft(IERC721 nftContract, uint256 nftId)
        private
        view
        returns (uint256)
    {
        require(nftContract.ownerOf(nftId) == address(this), "Loan not found");

        for (uint256 i = 0; i < loanIdCounter.current(); i++) {
            if (
                loans[i].nftContract == address(nftContract) &&
                loans[i].nftId == nftId
            ) {
                return i;
            }
        }

        revert("Loan not found");
    }

    function checkLoan(uint256 loanId) external {
        // TODO: implement this
    }
}
