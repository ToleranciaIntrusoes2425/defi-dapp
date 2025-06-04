import { defiContract, nftContract, updateBalances, web3 } from './connection.js';
import { defiContractAddress, nftContractAddress, nullAddress } from './constants.js';
import { displayOwnedNFTs } from './nft.js';
import { getFirstConnectedAccount, showAlert, truncateAddress } from './utils.js';

async function createLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    return;
  }

  const dexAmount = parseFloat(document.getElementById('Damount').value);
  if (isNaN(dexAmount) || dexAmount <= 0) {
    return;
  }

  const input = document.getElementById('deadline');
  const datetimeStr = input.value;

  if (!datetimeStr) {
    alert("Please select a date and time.");
    return;
  }

  const selectedTimestamp = Math.floor(new Date(datetimeStr).getTime() / 1000);
  const nowTimestamp = Math.floor(Date.now() / 1000);

  const maxDays = 28;
  const maxSeconds = maxDays * 24 * 60 * 60;

  const diff = selectedTimestamp - nowTimestamp;

  if (diff <= 0 || diff > maxSeconds) {
    alert("Please choose a date/time between now and 28 days from now.");
    return;
  }

  try {
    const timestampMs = new Date(datetimeStr).getTime();
    const timestampSec = Math.floor(timestampMs / 1000);
    const nowSec = Math.floor(Date.now() / 1000);
    const timeLoan = timestampSec - nowSec;
    const dexAmountWei = dexAmount;
    await defiContract.methods.loan(dexAmountWei, timeLoan).send({
      from: account
    });

    showAlert("Loan request created successfully!", "success");

    await updateBalances(account);
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error creating loan:", error);
    showAlert("Error creating loan", "danger");
  }
}


async function createNftLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const nftId = parseFloat(document.getElementById('nftId').value);
  if (!nftId || isNaN(nftId)) {
    alert('Please enter a valid NFT ID');
    return;
  }

  const loanAmountStr = document.getElementById('nftLoan').value.trim();
  if (!loanAmountStr || isNaN(loanAmountStr)) {
    alert('Please enter a valid amount');
    return;
  }
  
  const input = document.getElementById('nftDeadline');
  const datetimeStr = input.value;

  if (!datetimeStr) {
    alert("Please select a date and time.");
    return;
  }

  const selectedTimestamp = Math.floor(new Date(datetimeStr).getTime() / 1000);
  const nowTimestamp = Math.floor(Date.now() / 1000);

  const maxDays = 28;
  const maxSeconds = maxDays * 24 * 60 * 60;

  const diff = selectedTimestamp - nowTimestamp;

  if (diff <= 0 || diff > maxSeconds) {
    alert("Please choose a date/time between now and 28 days from now.");
    return;
  }

  try {
    const timestampMs = new Date(datetimeStr).getTime();
    const timestampSec = Math.floor(timestampMs / 1000);
    const nowSec = Math.floor(Date.now() / 1000);
    const timeLoan = timestampSec - nowSec;
    const loanAmountWei = web3.utils.toWei(loanAmountStr, "ether");
    await nftContract.methods.approve(defiContractAddress, nftId).send({ from: account });

    await defiContract.methods.makeLoanRequestByNft(nftContractAddress, nftId, loanAmountWei, timeLoan)
      .send({ from: account });

    await displayOwnedNFTs(account);
    showAlert("NFT loan request created successfully!", "success");
    await updateBalances(account);
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error creating NFT loan:", error);
    showAlert("Error creating NFT loan: " + error.message, "danger");
  }
}


async function makePayment(id) {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const loanId = parseInt(id);
  if (isNaN(loanId)) {
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

async function terminateLoan(id) {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const loanId = parseInt(id);
  if (isNaN(loanId)) {
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

    showAlert("Loan terminated successfully!", "success");

    await updateBalances(account);
    await loadActiveLoans(account);
  } catch (error) {
    console.error("Error terminating loan:", error);
    showAlert("Error terminating loan", "danger");
  }
}

async function loadActiveLoans(account) {
  try {
    const activeLoansContainer = document.getElementById('active-loans');
    if (!activeLoansContainer) return;

    activeLoansContainer.innerHTML = '';

    const loanIdCounter = await defiContract.methods.loanIdCounter().call();
    if (loanIdCounter === 0) {
      activeLoansContainer.innerHTML = '<p>No active loans found.</p>';
      return;
    }

    for (let i = 0; i < loanIdCounter; i++) {
      const loan = await defiContract.methods.loans(i).call();
      if (loan.borrower.toLowerCase() === account.toLowerCase()) {
        const loanElement = document.createElement('div');
        loanElement.className = 'loan-item mb-2 p-2 border border-2 rounded';
        loanElement.innerHTML = `
          <p><strong>Loan ID:</strong> ${i}</p>
          <p><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
          <p><strong>Deadline:</strong> ${new Date(loan.deadline * 1000).toLocaleString()}</p>
          <p><strong>Type:</strong> ${loan.isBasedNft ? 'NFT-based' : 'DEX-based'}</p>
        `;

        if (loan.isBasedNft) {
          loanElement.innerHTML += `
            <p><strong>NFT ID:</strong> ${loan.nftId}</p>
            <p><strong>Lender:</strong> ${loan.lender == nullAddress ? 'None' : truncateAddress(loan.lender, 8)}</p>
          `;
        }

        loanElement.innerHTML += `<button onclick="makePayment(${i})" class="btn btn-success w-100">Make Payment</button>`;

        if (!loan.isBasedNft) {
          loanElement.innerHTML += `<button onclick="terminateLoan(${i})" class="btn btn-danger w-100 mt-2">Terminate Loan</button>`;
        }

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
      showAlert(`New loan created by ${truncateAddress(event.returnValues.borrower, 8)} for ${event.returnValues.amount} Wei`, "info", 5000);
    })
    .on('error', async (error) => {
      const userAddress = await getFirstConnectedAccount();

      if (userAddress?.toLowerCase() !== owner?.toLowerCase()) return;

      console.error("Error in loanCreated event:", error);
      alert('Error in loan notifications: ' + error.message);
    });
}

export {
  checkAllLoans, createLoan,
  createNftLoan, initLoanNotifications, loadActiveLoans, makePayment,
  terminateLoan
};

