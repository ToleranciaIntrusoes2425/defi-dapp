import abiDefi from "./abi_defi.js";
import abiNft from "./abi_nft.js";
import { defiContractAddress, nftContractAddress } from "./constants.js";
import { getFirstAvailableAccount, getFirstConnectedAccount } from "./utils.js";
import { updateSwapRate } from "./exchange.js";

const web3 = new Web3(window.ethereum);
const defiContract = new web3.eth.Contract(abiDefi, defiContractAddress);
const nftContract = new web3.eth.Contract(abiNft, nftContractAddress);

async function updateBalances(account) {
  if (!account) return; 
  try {
    const dexBalance = await defiContract.methods.getDexBalance().call({ from: account });
    const cBalance = await defiContract.methods.getBalance().call({ from: account });
    document.querySelector('.dex-balance').textContent ="User Balance: " + dexBalance + " DEX";
    document.querySelector('.contract-balance').textContent = "Contract Balance: " + cBalance + " Wei";
  } catch (error) {
    console.error("Error updating balances:", error);
  }
}

async function updateUI(account) {
  const walletAddressElements = document.getElementsByClassName('wallet-address');
  Array.from(walletAddressElements).forEach(e => {
    e.innerText = account ? `${account.substring(0, 7)}...${account.substring(37)}` : 'Not connected';
  });

  const owner = await defiContract.methods.owner().call();
  if (owner.toLowerCase() === account.toLowerCase()) {
    document.querySelector('.change-rate-text').innerHTML = `
      <label><input type="number" id="rateInput" required></label>
      <label><button class="btn btn-primary" onclick="changeRate()">Change Rate</button></label>
    `;
  }
  else{
    document.querySelector('.change-rate-text').innerHTML = ``;
  }

  updateSwapRate();

  if (account) {
    updateBalances(account);
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
    alert("Please enter a valid rate");
    return;
  }

  try {
    console.log("New rate:", rateValue);

    await defiContract.methods.setDexSwapRate(rateValue).send({
      from: account
    });

    alert('Rate updated successfully!');
  } catch (error) {
    console.error("Error setting rate:", error);
    alert('Failed to set rate: ' + error.message);
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
  checkAccountConnection, 
  connectMetaMask, 
  defiContract,
  nftContract, 
  web3,
  updateBalances,
  changeRate
};