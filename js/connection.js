import abiDefi from "./abi_defi.js";
import abiNft from "./abi_nft.js";
import { defiContractAddress, nftContractAddress } from "./constants.js";
import { updateSwapRate } from "./exchange.js";
import { loadAvailableLoans } from "./lending.js";
import { loadActiveLoans } from "./loan.js";
import { displayOwnedNFTs } from "./nft.js";
import { getFirstAvailableAccount, getFirstConnectedAccount, showAlert, truncateAddress } from "./utils.js";

const web3 = new Web3(window.ethereum);
const defiContract = new web3.eth.Contract(abiDefi, defiContractAddress);
const defiContractOwner = await defiContract.methods.owner().call();
const nftContract = new web3.eth.Contract(abiNft, nftContractAddress);
const nftContractOwner = await nftContract.methods.owner().call();

function updateWalletConnect(account) {
  if (account) {
    document.querySelector(".wallet-connect-btn").style.display = "none";
    document.querySelector(".wallet-address").textContent = truncateAddress(account, 8);
  } else {
    document.querySelector(".wallet-connect-btn").style.display = "block";
    document.querySelector(".wallet-address").textContent = "";
  }
}

async function updateBalances(account) {
  if (!account) return;
  try {
    const dexBalance = await defiContract.methods.getDexBalance().call({ from: account });
    const cBalance = await defiContract.methods.getBalance().call({ from: account });
    document.querySelector('.dex-balance').textContent = "User Balance: " + dexBalance + " DEX";
    document.querySelector('.contract-balance').textContent = "Contract Balance: " + cBalance + " Wei";
  } catch (error) {
    console.error("Error updating balances:", error);
  }
}

async function updateUI(account) {
  updateWalletConnect(account);

  if (defiContractOwner.toLowerCase() === account.toLowerCase()) {
    document.querySelector('.change-rate-text').innerHTML = `
      <label><input type="number" id="rateInput" class="form-control" required min="0" step="1"></label>
      <label><button class="btn btn-primary" onclick="changeRate()">Change Rate</button></label>
    `;
  }
  else {
    document.querySelector('.change-rate-text').innerHTML = ``;
  }

  updateSwapRate();

  if (account) {
    loadActiveLoans(account);
    loadAvailableLoans(account);
    updateBalances(account);
    displayOwnedNFTs(account);
  }
}

async function changeRate() {
  const rateValue = document.getElementById('rateInput').value;

  const account = await getFirstAvailableAccount();
  if (!account) {
    alert('No account available');
    return;
  }

  const parsedRate = parseFloat(rateValue);
  if (isNaN(parsedRate) || parsedRate <= 0) {
    return;
  }

  try {
    console.log("New rate:", rateValue);

    await defiContract.methods.setDexSwapRate(rateValue).send({
      from: account
    });

    showAlert(`Rate set to 1 DEX = ${rateValue} Wei`, 'success');
  } catch (error) {
    console.error("Error setting rate:", error);
    showAlert('Failed to set rate.', 'danger');
  }

  await updateUI(account);
}

async function connectMetaMask() {
  const account = await getFirstAvailableAccount();
  if (!account) {
    console.log('No available accounts found.');
    return;
  }

  updateUI(account);
}

async function checkAccountConnection() {
  const account = await getFirstConnectedAccount();
  if (!account) {
    console.log('No connected accounts found.');
    return;
  }

  console.log('Connected account:', account);
  updateUI(account);

  // Set up balance refresh when account changes
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      updateUI(null);
    } else {
      updateUI(accounts[0]);
    }
  });
}

export {
  changeRate, checkAccountConnection,
  connectMetaMask,
  defiContract, defiContractOwner, nftContract, nftContractOwner, updateBalances, web3
};

