import { defiContract, defiInterest, defiPeriodicity, defiTermination, nftContract, updateBalances, web3 } from './connection.js';
import { defiContractAddress, nftContractAddress, nullAddress } from './constants.js';
import { loadActiveLendings } from './lending.js';
import { displayOwnedNFTs } from './nft.js';
import { formatDuration, getFirstConnectedAccount, showAlert, truncateAddress } from './utils.js';

async function populateLoanRates() {
  const interestElements = document.getElementsByClassName('loan-interest');
  const periodicityElements = document.getElementsByClassName('loan-periodicity');
  const terminationElements = document.getElementsByClassName('loan-termination');

  Array.from(interestElements).forEach(el => el.textContent = `Interest Rate: ${defiInterest}%`);
  Array.from(periodicityElements).forEach(el => el.textContent = `Periodicity: ${formatDuration(defiPeriodicity, false)}`);
  Array.from(terminationElements).forEach(el => el.textContent = `Termination Fee: ${defiTermination}%`);
}

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

    if (loan.lender === nullAddress) {
      alert('There\'s no lender for this loan yet.');
      return;
    }

    const totalPayments = getTotalPayments(loan);
    const isFinalPayment = loan.paymentsMade + 1 >= totalPayments;

    const interestPayment = loan.amount * defiInterest / 100;

    let totalDue = interestPayment;
    if (isFinalPayment) {
      totalDue += parseInt(loan.amount);
    }

    const nextPaymentDue = getNextPaymentDeadline(loan);
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

    await defiContract.methods.terminateLoan(loanId).send({
      from: account,
      value: getTerminationAmount(loan)
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
          <p class="m-0"><strong>Loan ID:</strong> ${i}</p>
          <p class="m-0"><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
        `;

        if (loan.isBasedNft) {
          loanElement.innerHTML += `
            <p class="m-0"><strong>NFT ID:</strong> ${loan.nftId}</p>
            <p class="m-0"><strong>Lender:</strong> ${loan.lender == nullAddress ? 'None' : truncateAddress(loan.lender, 8)}</p>
          `;
        } else {
          loanElement.innerHTML += `
            <p class="m-0"><strong>Dex Amount:</strong> ${loan.dexAmount} DEX</p>
          `;
        }

        const end = parseInt(loan.start) + parseInt(loan.deadline);

        loanElement.innerHTML += `
          <p class="m-0"><strong>Payments:</strong> ${loan.paymentsMade}/${getTotalPayments(loan)}</p>
          <p class="m-0"><strong>Paid Amount:</strong> ${web3.utils.fromWei(getPaidAmount(loan).toString(), 'ether')} ETH</p>
        `;

        if (!loan.isBasedNft || loan.lender !== nullAddress) {
          loanElement.innerHTML += `
            <p class="m-0"><strong>Start:</strong> ${new Date(loan.start * 1000).toLocaleString()} (${formatDuration(loan.start - Date.now() / 1000)})</p>
            <p class="m-0"><strong>Deadline:</strong> ${new Date(end * 1000).toLocaleString()} (${formatDuration(end - Date.now() / 1000)})</p>
            <p class="m-0"><strong>Next Payment Deadline:</strong> ${new Date(getNextPaymentDeadline(loan) * 1000).toLocaleString()} (${formatDuration(getNextPaymentDeadline(loan) - Date.now() / 1000)})</p>
            <button onclick="makePayment(${i})" class="btn btn-success w-100 mt-2">Make Payment (${web3.utils.fromWei(getNextPaymentValue(loan).toString(), 'ether')} ETH)</button>
            `;
        } else {
          loanElement.innerHTML += `
            <p class="m-0"><strong>Published:</strong> ${new Date(loan.start * 1000).toLocaleString()} (${formatDuration(Date.now() / 1000 - loan.start)})</p>
            <p class="m-0"><strong>Deadline:</strong> ${formatDuration(loan.deadline, false)}</p>
            <button onclick="cancelNftLoan(${i})" class="btn btn-danger w-100 mt-2">Cancel</button>
          `;
        }

        if (!loan.isBasedNft) {
          loanElement.innerHTML += `<button onclick="terminateLoan(${i})" class="btn btn-danger w-100 mt-2">Terminate (${web3.utils.fromWei(getTerminationAmount(loan).toString(), 'ether')} ETH)</button>`;
        }

        activeLoansContainer.appendChild(loanElement);
      }
    }
  } catch (error) {
    console.error("Error loading active loans:", error);
  }
}

async function cancelNftLoan(id) {
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

    if (!loan.isBasedNft) {
      alert('Cannot cancel DEX-based loans with this function');
      return;
    }

    if (loan.lender !== nullAddress) {
      alert('Cannot cancel a loan that has a lender');
      return;
    }

    await defiContract.methods.cancelLoanRequestByNft(nftContractAddress, loan.nftId).send({
      from: account
    });

    showAlert("Loan request cancelled successfully!", "success");

    await updateBalances(account);
    await loadActiveLoans(account);
    await displayOwnedNFTs(account);
  } catch (error) {
    console.error("Error terminating loan:", error);
    showAlert("Error terminating loan", "danger");
  }
}

async function checkAllLoans() {
  const account = await getFirstConnectedAccount();
  try {
    const loanCount = await defiContract.methods.loanIdCounter().call();

    for (let i = 0; i < loanCount; i++) {
      const loan = await defiContract.methods.loans(i).call();

      if (loan.borrower === nullAddress) {
        console.log(`Loan ${i} was already deleted (nullAddress). Skipping...`);
        continue;
      }

      console.log(`\nChecking Loan ${i}:`);
      console.log(`  Borrower: ${loan.borrower}`);
      console.log(`  Start: ${loan.start}`);
      console.log(`  Deadline: ${loan.deadline}`);
      console.log(`  Payments Made: ${loan.paymentsMade}`);

      const totalPayments = getTotalPayments(loan);
      const nextPaymentDue = getNextPaymentDeadline(loan);

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > loan.start + loan.deadline;
      const missedPayment = now > nextPaymentDue && loan.paymentsMade < totalPayments;

      console.log(`  Total Payments: ${totalPayments}`);
      console.log(`  Next Payment Due: ${nextPaymentDue} (${new Date(nextPaymentDue * 1000).toLocaleString()})`);
      console.log(`  Current Time: ${now} (${new Date(now * 1000).toLocaleString()})`);
      console.log(`  isExpired: ${isExpired}`);
      console.log(`  missedPayment: ${missedPayment}`);

      if (isExpired || missedPayment) {
        showAlert("Payment deadline missed. Loan will be deleted.", "danger");
        console.log(`  Attempting to check and close loan ${i}...`);
        try {
          await defiContract.methods.checkLoan(i).send({ from: account });
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
  } finally {
    await loadActiveLoans(account);
    await loadAvailableLoans(account);
    await displayOwnedNFTs(account);
    await loadActiveLendings(account);
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

function getTerminationAmount(loan) {
  const amount = parseInt(loan.amount);
  return Math.floor(amount * (1 + defiTermination / 100));
}

function getPaidAmount(loan) {
  const paymentsMade = parseInt(loan.paymentsMade);
  if (paymentsMade <= 0) {
    return 0;
  }
  const loanAmount = parseInt(loan.amount);
  return paymentsMade * loanAmount;
}

function getNextPaymentDeadline(loan) {
  const start = parseInt(loan.start);
  const paymentsMade = parseInt(loan.paymentsMade);
  const nextPaymentDeadline = start + (paymentsMade + 1) * defiPeriodicity;
  return nextPaymentDeadline;
}

function getTotalPayments(loan) {
  const deadline = parseInt(loan.deadline);
  return Math.floor(deadline / defiPeriodicity);
}

function getNextPaymentValue(loan) {
  const paymentsMade = parseInt(loan.paymentsMade);
  const amount = parseInt(loan.amount);

  const totalPayments = getTotalPayments(loan);

  const isFinalPayment = paymentsMade + 1 >= totalPayments;

  const interestPayment = amount * defiInterest / 100;

  let totalDue = interestPayment;
  if (isFinalPayment) {
    totalDue += amount;
  }

  return Math.floor(totalDue);
}

export {
  checkAllLoans, createLoan,
  createNftLoan, getNextPaymentDeadline, getNextPaymentValue, getPaidAmount, getTotalPayments, initLoanNotifications, loadActiveLoans, makePayment, populateLoanRates, terminateLoan, cancelNftLoan
};

