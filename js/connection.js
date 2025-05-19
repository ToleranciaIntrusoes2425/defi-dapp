import abi from "./abi.js";
import { getFirstAvailableAccount, getFirstConnectedAccount } from "./utils.js";

const contractAddress = '0x9cb6eA3311BCD6d8e863d90c94E4D890E1098C80';

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
}

export {
  web3,
  contract,
  connectMetaMask,
  checkAccountConnection,
};
