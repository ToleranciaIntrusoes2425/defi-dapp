import { defiContract, nftContract, updateBalances, web3 } from './connection.js';
import { defiContractAddress, nftContractAddress, nullAddress } from './constants.js';
import { loadActiveLendings, loadAvailableLoans } from './lending.js';
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

  const days = parseInt(document.getElementById('deadline').value);
  if (isNaN(days) || days <= 0 || days > 28) {
    return;
  }

  try {
    const dexAmountWei = dexAmount;
    const deadline = Math.floor(Date.now() / 1000) + (days * 86400);
    await defiContract.methods.loan(dexAmountWei, deadline).send({
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

    const totalPayments = Math.floor((loan.deadline - loan.start) / periodicity);
    const isFinalPayment = loan.paymentsMade + 1 >= totalPayments;

    const interestPayment = loan.amount * interestRate / 100;
    let totalDue = interestPayment;

    if (isFinalPayment) {
      totalDue += parseInt(loan.amount);
    }

    const nextPaymentDue = parseInt(loan.start) + (parseInt(loan.paymentsMade) + 1) * parseInt(periodicity);

    const now = Math.floor(Date.now() / 1000);

    if (now > nextPaymentDue) {
      showAlert("Payment deadline missed. Loan will be deleted.", "danger");
      await defiContract.methods.checkLoan(loanId).send({ from: account });
      await loadActiveLoans(account);
      return;
    }

    await defiContract.methods.makePayment(loanId).send({
      from: account,
      value: totalDue
    });

    showAlert('Payment made successfully!', 'success');
    await loadActiveLoans(account);
    await updateBalances(account);
  } catch (error) {
    console.error("Error making payment:", error);
    showAlert('Error making payment: ' + error.message, 'danger');
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

      if (loan.borrower === nullAddress) {
        continue;
      }

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
    const account = await getFirstConnectedAccount();
    const periodicity = await defiContract.methods.periodicity().call();

    // console.log(`Total loans: ${loanCount}`);
    // console.log(`Periodicity: ${periodicity} seconds`);

    for (let i = 0; i < loanCount; i++) {
      const loan = await defiContract.methods.loans(i).call();

      if (loan.borrower === nullAddress ) {
        console.log(`Loan ${i} was already deleted (nullAddress). Skipping...`);
        continue;
      }

      console.log(`\nChecking Loan ${i}:`);
      console.log(`  Borrower: ${loan.borrower}`);
      console.log(`  Start: ${loan.start}`);
      console.log(`  Deadline: ${loan.deadline}`);
      console.log(`  Payments Made: ${loan.paymentsMade}`);

      const totalPayments = Math.floor((loan.deadline - loan.start) / periodicity);
      const nextPaymentDue = parseInt(loan.start) + (parseInt(loan.paymentsMade) + 1) * parseInt(periodicity);

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > loan.deadline;
      const missedPayment = now > nextPaymentDue && loan.paymentsMade < totalPayments;

      console.log(`  Total Payments: ${totalPayments}`);
      console.log(`  Next Payment Due: ${nextPaymentDue} (${new Date(nextPaymentDue * 1000).toLocaleString()})`);
      console.log(`  Current Time: ${now} (${new Date(now * 1000).toLocaleString()})`);
      console.log(`  isExpired: ${isExpired}`);
      console.log(`  missedPayment: ${missedPayment}`);

      if (isExpired || missedPayment) {
        console.log(`  Attempting to check and close loan ${i}...`);
        try {
          await defiContract.methods.checkLoan(i).send({ from: account });
          await loadActiveLoans(account);
          await loadAvailableLoans(account);
          await displayOwnedNFTs(account);
          await loadActiveLendings(account);
          console.log(`Loan ${i} checked and closed`)
          console.log(`Loan ${i} checked`);
        } catch (error) {
          console.error(`Error checking loan ${i}:`, error);
        }
      } else {
        console.log(`Loan ${i} is still active`);
      }
    }
    console.log('All loans checked');
  } catch (error) {
    console.error("Error checking loans:", error);
  }
}

setInterval(() => {
  checkAllLoans();
}, 10 * 60 * 1000);

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

