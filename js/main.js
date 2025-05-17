import abi from "./abi.js";

const contractAddress = '0xE44587809DDD06Af56d9795D41D645CFece42c03';

const web3 = new Web3(window.ethereum);
const contract = new web3.eth.Contract(abi, contractAddress);

function updateUI(account) {
  Array.from(document.getElementsByClassName('btn--connect')).forEach(e => {
    e.style.display = 'none';
  });

  Array.from(document.getElementsByClassName('wallet-address')).forEach(e => {
    e.innerText += account;
    e.style.display = 'block';
  });
}

async function connectMetaMask() {
  if (!window.ethereum) {
    console.error('MetaMask is not installed.');
    alert('MetaMask is not installed. Please install it.');
    return;
  }

  try {
    const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' }));

    if (accounts.length === 0) {
      console.error('No accounts found.');
      alert('No accounts found. Please connect to MetaMask.');
      return;
    }

    const account = accounts[0];

    console.log('Connected account:', account);

    updateUI(account);
  } catch (error) {
    console.error('Error connecting to MetaMask:', error);
  }
}

async function getConnectedAccount() {
  if (!window.ethereum) {
    console.error('MetaMask is not installed.');
    alert('MetaMask is not installed. Please install it.');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length > 0) {
      return accounts[0];
    }
  } catch (error) {
    console.error('Error getting connected account:', error);
  }

  return null;
}

async function checkAccountConnection() {
  const account = await getConnectedAccount();

  if (!account) {
    console.log('No connected accounts found.');
    return;
  }

  console.log('Connected account:', account);
  updateUI(account);
}

window.connectMetaMask = connectMetaMask;

window.addEventListener('load', checkAccountConnection);
