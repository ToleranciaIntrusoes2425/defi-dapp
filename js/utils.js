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
    console.log((await window.ethereum.request({ method: 'eth_requestAccounts' }))[0])
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

function showAlert(message, type = "success", timeout = 3000) {
  const containerElements = document.getElementsByClassName('alert-container');
  Array.from(containerElements).forEach(container => {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show mb-2`;
    alert.setAttribute("role", "alert");

    alert.innerHTML = `
        <span class="alert-message">${message}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;

    container.appendChild(alert);

    if (timeout > 0) {
      setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
        bsAlert.close();
      }, timeout);
    }
  });
}

function truncateDecimals(num, decimals = 18) {
  const [intPart, decimalPart = ''] = num.toString().split('.');
  const truncatedDecimal = decimalPart.slice(0, decimals).padEnd(decimals, '0');
  return `${intPart}.${truncatedDecimal}`;
}

function truncateAddress(address, length = 6) {
  if (!address || address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export {
  alertMetaMaskMissing,
  getFirstAvailableAccount,
  getFirstConnectedAccount,
  showAlert, truncateAddress, truncateDecimals
};

