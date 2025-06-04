import { defiContract, nftContract, updateBalances, web3 } from './connection.js';
import { nullAddress } from './constants.js';
import { getFirstConnectedAccount } from './utils.js';

async function loadAvailableLoans() {
  try {
    const loanRequestsContainer = document.querySelector('.loan-requests');
    if (!loanRequestsContainer) return;

    loanRequestsContainer.innerHTML = '';

    const loanIdCounter = await defiContract.methods.loanIdCounter().call();
    if (loanIdCounter === 0) {
      activeLoansContainer.innerHTML = '<p>No active loans found.</p>';
      return;
    }

    for (let i = 0; i < loanIdCounter; i++) {
      const loan = await defiContract.methods.loans(i).call();

      if (loan.isBasedNft && loan.lender === nullAddress) {
        const loanElement = document.createElement('div');
        loanElement.className = 'loan-item mb-2 p-2 border border-2 rounded';
        loanElement.innerHTML = `
          <p><strong>Loan ID:</strong> ${i}</p>
          <p><strong>NFT ID:</strong> ${loan.nftId}</p>
          <p><strong>Amount:</strong> ${web3.utils.fromWei(loan.amount, 'ether')} ETH</p>
          <p><strong>Deadline:</strong> ${new Date(loan.deadline * 1000).toLocaleString()}</p>
          <button onclick="lendToNftLoan(${i})" class="btn btn-success w-100">Lend</button>
        `;
        loanRequestsContainer.appendChild(loanElement);
      }
    }
  } catch (error) {
    console.error("Error loading available loans:", error);
  }
}

async function lendToNftLoan() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const loanId = document.getElementById('loan-id').value;
  if (!loanId || isNaN(loanId)) {
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
      nftContract.options.address,
      loan.nftId
    ).send({
      from: account,
      value: loan.amount
    });

    alert('Loan funded successfully!');
    await loadAvailableLoans();
    await updateBalances(account);
  } catch (error) {
    console.error("Error funding loan:", error);
    alert('Error funding loan: ' + error.message);
  }
}

export { lendToNftLoan, loadAvailableLoans };

