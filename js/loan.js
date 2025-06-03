import { defiContract, nftContract, web3, updateBalances } from './connection.js';
import { getFirstConnectedAccount } from './utils.js';
import { defiContractAddress, nftContractAddress } from './constants.js'
import { displayOwnedNFTs } from './nft.js'

async function createLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const dexAmount = parseFloat(document.getElementById('Damount').value);
  if (isNaN(dexAmount) || dexAmount <= 0) {
    alert('Please enter a valid amount greater than 0');
    return;
  }

  const days = parseInt(document.getElementById('deadline').value);
  if (isNaN(days) || days <= 0 || days > 28) {
    alert('Please enter a valid duration (1 to 28 days)');
    return;
  }

  try {
    const dexAmountWei = dexAmount;
    const deadline = Math.floor(Date.now() / 1000) + (days * 86400);
    await defiContract.methods.loan(dexAmountWei, deadline).send({
      from: account
    });

    alert('Loan created successfully!');
    await updateBalances(account);
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error creating loan:", error);
    alert('Error creating loan: ' + (error?.message ?? error));
  }
}


async function createNftLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const nftId = prompt('Enter NFT ID to use as collateral:');
  if (!nftId || isNaN(nftId)) {
    alert('Please enter a valid NFT ID');
    return;
  }

  const loanAmount = prompt('Enter loan amount in ETH:');
  if (!loanAmount || isNaN(loanAmount)) {
    alert('Please enter a valid amount');
    return;
  }

  const days = prompt('Enter loan duration in days (max 28 days):');
  if (!days || isNaN(days) || days > 28) {
    alert('Please enter a valid duration (max 28 days)');
    return;
  }

  try {
    const deadline = Math.floor(Date.now() / 1000) + (parseInt(days) * 86400);
    const loanAmountWei = web3.utils.toWei(loanAmount, "ether");

    await nftContract.methods.approve(defiContractAddress, nftId).send({ from: account });

    await defiContract.methods.makeLoanRequestByNft(nftContractAddress, nftId, loanAmountWei, deadline)
      .send({ from: account });

    await displayOwnedNFTs(account);
    alert('NFT Loan request created successfully!');
  } catch (error) {
    console.error("Error creating NFT loan:", error);
    alert('Error creating NFT loan: ' + error.message);
  }
}


async function makePayment() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const loanId = prompt('Enter Loan ID to make payment for:');
  if (!loanId || isNaN(loanId)) {
    alert('Please enter a valid Loan ID');
    return;
  }

  try {
    const loan = await defiContract.methods.loans(loanId).call();
    if (!loan || loan.borrower.toLowerCase() !== account.toLowerCase()) {
      alert('Loan not found or you are not the borrower');
      return;
    }

    const interestRate = await defiContract.methods.interest().call();
    const periodicity = await defiContract.methods.periodicity().call();
    
    // Calculate payment amount (simplified for demo)
    const paymentAmount = loan.amount * interestRate / 100;
    
    await defiContract.methods.makePayment(loanId).send({
      from: account,
      value: paymentAmount
    });
    
    alert('Payment made successfully!');
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error making payment:", error);
    alert('Error making payment: ' + error.message);
  }
}

async function terminateLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const loanId = prompt('Enter Loan ID to terminate:');
  if (!loanId || isNaN(loanId)) {
    alert('Please enter a valid Loan ID');
    return;
  }

  try {
    const loan = await defiContract.methods.loans(loanId).call();
    if (!loan || loan.borrower.toLowerCase() !== account.toLowerCase()) {
      alert('Loan not found or you are not the borrower');
      return;
    }

    if (loan.isBasedNft) {
      alert('Cannot terminate NFT-based loans with this function');
      return;
    }

    const terminationFee = await defiContract.methods.termination().call();
    const terminationAmount = loan.amount * (1 + terminationFee);
    
    await defiContract.methods.terminateLoan(loanId).send({
      from: account,
      value: terminationAmount
    });
    
    alert('Loan terminated successfully!');
    await updateBalances(account);
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error terminating loan:", error);
    alert('Error terminating loan: ' + error.message);
  }
}

async function loadActiveLoans(account) {
  try {
    const activeLoansContainer = document.getElementById('active-loans');
    if (!activeLoansContainer) return;

    activeLoansContainer.innerHTML = '';
    
    const loanCount = await defiContract.methods.loans().call().size();
    console.log(loanCount)
    for (let i = 0; i < loanCount; i++) {
      const loan = await defiContract.methods.loans(i).call();
      if (loan.borrower.toLowerCase() === account.toLowerCase()) {
        const loanElement = document.createElement('div');
        loanElement.className = 'loan-item mb-2 p-2 border rounded';
        loanElement.innerHTML = `
          <p><strong>Loan ID:</strong> ${i}</p>
          <p><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
          <p><strong>Deadline:</strong> ${new Date(loan.deadline * 1000).toLocaleString()}</p>
          <p><strong>Type:</strong> ${loan.isBasedNft ? 'NFT-based' : 'DEX-based'}</p>
        `;
        activeLoansContainer.appendChild(loanElement);
      }
    }
  } catch (error) {
    console.error("Error loading active loans:", error);
  }
}

async function checkAllLoans() {
  try {
    const loanCount = await defiContract.methods.loanIdCounter().call();
    for (let i = 0; i < loanCount; i++) {
      await defiContract.methods.checkLoan(i).send({ from: await getFirstConnectedAccount() });
    }
    console.log('All loans checked');
  } catch (error) {
    console.error("Error checking loans:", error);
  }
}

async function initLoanNotifications() {
  const owner = await defiContract.methods.owner().call();

  defiContract.events.loanCreated({
    fromBlock: 'latest'
  })
  .on('data', async (event) => {
    const userAddress = await getFirstConnectedAccount();

    if (userAddress?.toLowerCase() !== owner?.toLowerCase()) return;

    console.log('New loan:', event.returnValues);
    alert(`New loan created by ${event.returnValues.borrower} for ${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH`);
  })
  .on('error', async (error) => {
    const userAddress = await getFirstConnectedAccount();
    
    if (userAddress?.toLowerCase() !== owner?.toLowerCase()) return;

    console.error("Error in loanCreated event:", error);
    alert('Error in loan notifications: ' + error.message);
  });
}

export {
  initLoanNotifications,
  createLoan,
  createNftLoan,
  makePayment,
  terminateLoan,
  loadActiveLoans,
  checkAllLoans
};