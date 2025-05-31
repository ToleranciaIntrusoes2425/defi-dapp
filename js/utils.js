function alertMetaMaskMissing() {
  console.error('MetaMask is not installed.');
  alert('MetaMask is not installed. Please install it.');
}

async function getFirstAvailableAccount() {
  if (!window.ethereum) {
    alertMetaMaskMissing();
    return null;
  }

  try {
    const account = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
    return account ?? null;
  } catch (error) {
    console.error('Error getting first available account:', error);
  }

  return null;
}

async function getFirstConnectedAccount() {
  if (!window.ethereum) {
    alertMetaMaskMissing();
    return null;
  }

  try {
    const account = (await window.ethereum.request({ method: 'eth_accounts' }))[0];
    return account ?? null;
  } catch (error) {
    console.error('Error getting first connected account:', error);
  }

  return null;
}

export {
  alertMetaMaskMissing,
  getFirstAvailableAccount,
  getFirstConnectedAccount
};
