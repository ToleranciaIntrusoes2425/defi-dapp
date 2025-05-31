import abiDefi from "./abi_defi.js";
import abiNft from "./abi_nft.js";
import { defiContractAddress, nftContractAddress } from "./constants.js";
import { getFirstAvailableAccount, getFirstConnectedAccount } from "./utils.js";

const web3 = new Web3(window.ethereum);
const defiContract = new web3.eth.Contract(abiDefi, defiContractAddress);
const nftContract = new web3.eth.Contract(abiNft, nftContractAddress);

async function updateBalances(account) {
  if (!account) return; 
  try {
    const dexBalance = await defiContract.methods.getDexBalance().call({ from: account });
    document.querySelector('.dex-balance').textContent = dexBalance + " DEX";
  } catch (error) {
    console.error("Error updating balances:", error);
  }
}

function updateUI(account) {
  const walletAddressElements = document.getElementsByClassName('wallet-address');
  Array.from(walletAddressElements).forEach(e => {
    e.innerText = account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'Not connected';
  });
  
  if (account) {
    updateBalances(account);
  }
}

async function connectMetaMask() {
  const account = await getFirstAvailableAccount();
  if (!account) {
    console.log('No available accounts found.');
    return;
  }

  console.log('Connected account:', account);
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
  updateBalances
};