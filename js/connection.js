import abiDefi from "./abi_defi.js";
import abiNft from "./abi_nft.js";
import { defiContractAddress, nftContractAddress } from "./constants.js";
import { getFirstAvailableAccount, getFirstConnectedAccount } from "./utils.js";

const web3 = new Web3(window.ethereum);
const defiContract = new web3.eth.Contract(abiDefi, defiContractAddress);
const nftContract = new web3.eth.Contract(abiNft, nftContractAddress);

function updateUI(account) {
  Array.from(document.getElementsByClassName('wallet-address')).forEach(e => {
    e.innerText = account;
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
  checkAccountConnection, connectMetaMask, defiContract,
  nftContract, web3
};

