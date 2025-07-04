// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DecentralizedFinance is ERC20, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter public loanIdCounter;

    // TODO: Review types (for optimization)
    struct Loan {
        uint256 amount; // in Wei
        uint256 dexAmount; // in DEX
        uint256 nftId;
        uint256 start;
        address lender;
        address borrower;
        address nftContract;
        uint64 deadline;
        uint8 paymentsMade;
        bool isBasedNft;
        bool isActive;
    }

    // TODO: Review types & visibility modifiers (for optimization)
    uint256 public dexSwapRate;
    uint256 public immutable periodicity;
    uint256 public immutable interest;
    uint256 public immutable termination;
    uint256 public constant maxLoanDuration = 4 weeks;

    mapping(uint256 => Loan) public loans;
    mapping(address => mapping(uint256 => uint256)) private nftToLoanId; // nftToLoanId[nftContractAddress][nftId] = loanId

    event loanCreated(
        address indexed borrower,
        uint256 amount,
        uint256 deadline
    );

    constructor(
        uint256 rate,
        uint256 _periodicity, // in seconds
        uint256 _interest,
        uint256 _termination
    ) ERC20("DEX", "DEX") Ownable(msg.sender) {
        require(rate > 0, "Rate must be > 0");
        require(_periodicity > 0, "Periodicity must be > 0");
        require(_interest >= 0, "Interest must be >= 0");
        require(_termination >= 0, "Termination must be >= 0");

        dexSwapRate = rate;
        periodicity = _periodicity;
        interest = _interest;
        termination = _termination;

        _mint(address(this), 10**18);
    }

    function buyDex() external payable {
        require(msg.value > 0, "Value must be > 0");

        uint256 dexAmount = weiToDex(msg.value);

        require(dexAmount > 0, "DEX amount must be > 0");
        require(
            balanceOf(address(this)) >= dexAmount,
            "Contract doesn't have enough DEX"
        );

        _transfer(address(this), msg.sender, dexAmount);

        uint256 weiRefundAmount = msg.value - dexToWei(dexAmount);

        if (weiRefundAmount > 0) {
            payable(msg.sender).transfer(weiRefundAmount);
        }
    }

    function sellDex(uint256 dexAmount) external {
        require(dexAmount > 0, "Value must be > 0");
        require(
            balanceOf(msg.sender) >= dexAmount,
            "You don't have that amount of DEX"
        );

        uint256 weiAmount = dexToWei(dexAmount);

        require(
            address(this).balance >= weiAmount,
            "Contract doesn't have enough ETH"
        );

        _transfer(msg.sender, address(this), dexAmount);
        payable(msg.sender).transfer(weiAmount);
    }

    function loan(uint256 dexAmount, uint64 deadline)
        external
        returns (uint256)
    {
        require(dexAmount > 0, "Value must be > 0");
        require(
            deadline <= maxLoanDuration,
            "Maximum duration of the loan cannot exceed 4 weeks"
        );
        require(
            balanceOf(msg.sender) >= dexAmount,
            "You don't have enough DEX"
        );

        uint256 weiAmount = dexToWei(dexAmount);

        require(
            address(this).balance >= weiAmount,
            "Contract doesn't have enough ETH"
        );

        uint256 id = loanIdCounter.current();

        loans[id] = Loan({
            amount: weiAmount,
            dexAmount: dexAmount,
            nftId: 0,
            start: block.timestamp,
            lender: address(this),
            borrower: msg.sender,
            nftContract: address(0),
            deadline: deadline,
            paymentsMade: 0,
            isBasedNft: false,
            isActive: true
        });

        loanIdCounter.increment();

        _transfer(msg.sender, address(this), dexAmount);
        payable(msg.sender).transfer(weiAmount);

        emit loanCreated(msg.sender, weiAmount, deadline);

        return id;
    }

    function makePayment(uint256 loanId) external payable {
        require(loanId < loanIdCounter.current(), "Loan not found");

        Loan storage _loan = loans[loanId];

        require(_loan.isActive, "Loan not found");
        require(
            _loan.borrower == msg.sender,
            "You're not the borrower of that loan"
        );
        require(_loan.lender != address(0), "There's no lender for that loan");

        uint256 totalPayments = _loan.deadline / periodicity;
        bool isFinalPayment = (_loan.paymentsMade + 1 >= totalPayments);

        uint256 interestPayment = (_loan.amount * interest) / 100;
        uint256 totalDue = interestPayment;

        uint256 nextPaymentDue = _loan.start +
            (_loan.paymentsMade + 1) *
            periodicity;

        if (block.timestamp > nextPaymentDue) {
            if (_loan.isBasedNft) {
                IERC721(_loan.nftContract).transferFrom(
                    address(this),
                    _loan.lender,
                    _loan.nftId
                );

                delete nftToLoanId[_loan.nftContract][_loan.nftId];
            }

            delete loans[loanId];

            payable(msg.sender).transfer(msg.value);
            return;
        }

        if (isFinalPayment) {
            totalDue += _loan.amount;
        }

        require(msg.value >= totalDue, "Not enough ETH");

        if (_loan.lender != address(this)) {
            payable(_loan.lender).transfer(totalDue);
        }

        _loan.paymentsMade += 1;

        if (isFinalPayment) {
            if (_loan.isBasedNft) {
                IERC721(_loan.nftContract).transferFrom(
                    address(this),
                    _loan.borrower,
                    _loan.nftId
                );

                delete nftToLoanId[_loan.nftContract][_loan.nftId];
            } else {
                _transfer(address(this), _loan.borrower, _loan.dexAmount);
            }
            delete loans[loanId];
        }

        if (msg.value > totalDue) {
            payable(msg.sender).transfer(msg.value - totalDue);
        }
    }

    function terminateLoan(uint256 loanId) external payable {
        require(loanId < loanIdCounter.current(), "Loan not found");

        Loan storage _loan = loans[loanId];

        require(_loan.isActive, "Loan not found");
        require(
            _loan.borrower == msg.sender,
            "You're not the borrower of that loan"
        );
        require(
            !_loan.isBasedNft,
            "This function is not available for NFT-based loans"
        );
        require(_loan.lender != address(0), "There's no lender for that loan");

        uint256 terminationFee = (_loan.amount * termination) / 100;
        uint256 weiTerminationAmount = (_loan.amount + terminationFee);

        require(
            msg.value >= weiTerminationAmount,
            "Insufficient termination amount"
        );

        uint256 weiRefundAmount = msg.value - weiTerminationAmount;
        if (weiRefundAmount > 0) {
            payable(msg.sender).transfer(weiRefundAmount);
        }

        if (_loan.lender != address(this)) {
            payable(_loan.lender).transfer(weiTerminationAmount);
        }

        _transfer(address(this), msg.sender, _loan.dexAmount);

        delete loans[loanId];
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function setDexSwapRate(uint256 rate) external onlyOwner {
        require(rate > 0, "Rate must be > 0");
        dexSwapRate = rate;
    }

    function getDexBalance() external view returns (uint256) {
        return balanceOf(msg.sender);
    }

    function makeLoanRequestByNft(
        IERC721 nftContract,
        uint256 nftId,
        uint256 loanAmount, // in Wei
        uint64 deadline
    ) external returns (uint256) {
        require(loanAmount > 0, "Value must be > 0");
        require(
            deadline <= maxLoanDuration,
            "Maximum duration of the loan cannot exceed 4 weeks"
        );
        require(
            nftContract.ownerOf(nftId) == msg.sender,
            "You're not the owner of the NFT"
        );

        address nftContractAddress = address(nftContract);
        uint256 id = loanIdCounter.current();

        loans[id] = Loan({
            amount: loanAmount,
            dexAmount: 0,
            nftId: nftId,
            start: block.timestamp,
            lender: address(0),
            borrower: msg.sender,
            nftContract: nftContractAddress,
            deadline: deadline,
            paymentsMade: 0,
            isBasedNft: true,
            isActive: true
        });

        nftToLoanId[nftContractAddress][nftId] = id;

        loanIdCounter.increment();

        nftContract.transferFrom(msg.sender, address(this), nftId);

        return id;
    }

    function cancelLoanRequestByNft(IERC721 nftContract, uint256 nftId)
        external
    {
        uint256 id = getLoanIdByNft(nftContract, nftId);

        Loan storage _loan = loans[id];

        require(_loan.isActive, "Loan not found");
        require(
            _loan.borrower == msg.sender,
            "You're not the borrower of that loan"
        );
        require(
            _loan.lender == address(0),
            "There's already a lender for that loan"
        );

        delete loans[id];
        delete nftToLoanId[address(nftContract)][nftId];

        nftContract.transferFrom(address(this), msg.sender, nftId);
    }

    function loanByNft(IERC721 nftContract, uint256 nftId) external payable {
        uint256 id = getLoanIdByNft(nftContract, nftId);
        Loan storage _loan = loans[id];

        require(_loan.isActive, "Loan not found");
        require(
            _loan.lender == address(0),
            "There's already a lender for that loan"
        );
        require(_loan.borrower != msg.sender, "You can't lend to yourself");
        require(msg.value == _loan.amount, "Incorrect ETH amount sent");

        _loan.start = block.timestamp;
        _loan.lender = msg.sender;

        payable(_loan.borrower).transfer(_loan.amount);

        emit loanCreated(_loan.borrower, _loan.amount, _loan.deadline);
    }

    function checkLoan(uint256 loanId) external onlyOwner {
        require(loanId < loanIdCounter.current(), "Loan not found");

        Loan storage _loan = loans[loanId];

        require(_loan.isActive, "Loan not found");

        uint256 nextPaymentDue = _loan.start +
            (_loan.paymentsMade + 1) *
            periodicity;

        require(
            block.timestamp > _loan.start + _loan.deadline ||
                block.timestamp > nextPaymentDue,
            "Loan is still active and on schedule"
        );

        if (_loan.isBasedNft) {
            if (_loan.lender == address(0)) {
                IERC721(_loan.nftContract).transferFrom(
                    address(this),
                    _loan.borrower,
                    _loan.nftId
                );
            } else {
                IERC721(_loan.nftContract).transferFrom(
                    address(this),
                    _loan.lender,
                    _loan.nftId
                );
            }

            delete nftToLoanId[_loan.nftContract][_loan.nftId];
        }

        delete loans[loanId];
    }

    function getLoanIdByNft(IERC721 nftContract, uint256 nftId)
        private
        view
        returns (uint256)
    {
        address nftContractAddress = address(nftContract);
        uint256 loanId = nftToLoanId[nftContractAddress][nftId];

        require(loanId < loanIdCounter.current(), "Loan not found");

        Loan storage _loan = loans[loanId];
        require(_loan.isActive, "Loan not found");
        require(
            _loan.nftContract == nftContractAddress && _loan.nftId == nftId,
            "Loan not found"
        );
        require(nftContract.ownerOf(nftId) == address(this), "Loan not found");

        return loanId;
    }

    function dexToWei(uint256 dexAmount) internal view returns (uint256) {
        return dexAmount * dexSwapRate;
    }

    function weiToDex(uint256 weiAmount) internal view returns (uint256) {
        return weiAmount / dexSwapRate;
    }

    function secondsToYears(uint256 seconds_) internal pure returns (uint256) {
        return seconds_ / 365 days;
    }
}
