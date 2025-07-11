import { defiContract, updateBalances, web3 } from './connection.js';
import { nftContractAddress, nullAddress } from './constants.js';
import { getNextPaymentDeadline, getPaidAmount, getTotalPayments } from './loan.js';
import { formatDuration, getFirstConnectedAccount, showAlert, truncateAddress } from './utils.js';

async function loadAvailableLoans(account) {
  try {
    const loanRequestsContainer = document.querySelector('.loan-requests');
    if (!loanRequestsContainer) return;

    loanRequestsContainer.innerHTML = '';

    const loanIdCounter = await defiContract.methods.loanIdCounter().call();
    if (loanIdCounter === 0) {
      activeLoansContainer.innerHTML = '<p>No available loans found.</p>';
      return;
    }

    for (let i = 0; i < loanIdCounter; i++) {
      const loan = await defiContract.methods.loans(i).call();

      if (loan.isBasedNft && loan.lender === nullAddress && loan.borrower.toLowerCase() !== account.toLowerCase()) {
        const end = parseInt(loan.start) + parseInt(loan.deadline);

        const loanElement = document.createElement('div');
        loanElement.className = 'loan-item mb-2 p-2 border border-2 rounded';
        loanElement.innerHTML = `
          <p class="m-0"><strong>Loan ID:</strong> ${i}</p>
          <p class="m-0"><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
          <p class="m-0"><strong>NFT ID:</strong> ${loan.nftId}</p>
          <p class="m-0"><strong>Borrower:</strong> ${truncateAddress(loan.borrower, 8)}</p>
          <p class="m-0"><strong>Published:</strong> ${new Date(end * 1000).toLocaleString()} (${formatDuration(loan.start - Date.now() / 1000)})</p>
          <p class="m-0"><strong>Deadline:</strong> ${formatDuration(loan.deadline, false)}</p>
          <button onclick="lendToNftLoan(${i})" class="btn btn-success w-100 mt-2">Lend</button>
        `;
        loanRequestsContainer.appendChild(loanElement);
      }
    }
  } catch (error) {
    console.error("Error loading available loans:", error);
  }
}

async function loadActiveLendings(account) {
  try {
    const loanLendingsContainer = document.querySelector('.loan-lendings');
    if (!loanLendingsContainer) return;

    loanLendingsContainer.innerHTML = '';

    const loanIdCounter = await defiContract.methods.loanIdCounter().call();
    if (loanIdCounter === 0) {
      activeLoansContainer.innerHTML = '<p>No available loans found.</p>';
      return;
    }

    console.log("Loading active lendings for account:", account);
    console.log("Total loan IDs:", loanIdCounter);

    for (let i = 0; i < loanIdCounter; i++) {
      const loan = await defiContract.methods.loans(i).call();
      const end = parseInt(loan.start) + parseInt(loan.deadline);

      if (loan.isBasedNft && loan.lender.toLowerCase() === account.toLowerCase()) {
        const loanElement = document.createElement('div');
        loanElement.className = 'loan-item mb-2 p-2 border border-2 rounded';
        loanElement.innerHTML = `
          <p class="m-0"><strong>Loan ID:</strong> ${i}</p>
          <p class="m-0"><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
          <p class="m-0"><strong>NFT ID:</strong> ${loan.nftId}</p>
          <p class="m-0"><strong>Borrower:</strong> ${truncateAddress(loan.borrower, 8)}</p>
          <p class="m-0"><strong>Payments:</strong> ${loan.paymentsMade}/${getTotalPayments(loan)}</p>
          <p class="m-0"><strong>Paid Amount:</strong> ${web3.utils.fromWei(getPaidAmount(loan).toString(), 'ether')} ETH   of   ${web3.utils.fromWei(loan.amount, 'ether')}</p>
          <p class="m-0"><strong>Unpaid Amount:</strong> ${web3.utils.fromWei(getUnpaidAmount(loan).toString(), 'ether')} ETH</p>
          <p class="m-0"><strong>Start:</strong> ${new Date(loan.start * 1000).toLocaleString()} (${formatDuration(loan.start - Date.now() / 1000)})</p>
          <p class="m-0"><strong>Deadline:</strong> ${new Date(end * 1000).toLocaleString()} (${formatDuration(end - Date.now() / 1000)})</p>
          <p class="m-0"><strong>Next Payment Deadline:</strong> ${new Date(getNextPaymentDeadline(loan) * 1000).toLocaleString()} (${formatDuration(getNextPaymentDeadline(loan) - Date.now() / 1000)})</p>
        `;
        loanLendingsContainer.appendChild(loanElement);
      }
    }
  } catch (error) {
    console.error("Error loading available lendings:", error);
  }
}

async function lendToNftLoan(id) {
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
    if (!loan || !loan.isBasedNft || loan.lender !== '0x0000000000000000000000000000000000000000') {
      alert('Invalid loan or already funded');
      return;
    }

    await defiContract.methods.loanByNft(
      nftContractAddress,
      loan.nftId
    ).send({
      from: account,
      value: loan.amount
    });

    showAlert('Loan funded successfully!', 'success');
    await loadAvailableLoans(account);
    await loadActiveLendings(account);
    await updateBalances(account);
  } catch (error) {
    console.error("Error funding loan:", error);
    showAlert('Error funding loan', 'danger');
  }
}

export { lendToNftLoan, loadAvailableLoans, loadActiveLendings };

