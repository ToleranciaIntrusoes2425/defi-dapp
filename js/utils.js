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

function showAlert(message, type = "success", timeout = 6000) {
  const containerElements = document.getElementsByClassName('alert-container');
  Array.from(containerElements).forEach(container => {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show mb-2`;
    alert.setAttribute("role", "alert");

    alert.style.display = "inline-block";
    alert.style.width = "auto";
    alert.style.maxWidth = "100%";
    alert.style.overflowWrap = "break-word";

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

function formatDuration(seconds, withLabel = true) {
  let secondsValue = Math.abs(seconds);

  const units = [
    ['week', 7 * 24 * 60 * 60],
    ['day', 24 * 60 * 60],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];

  const parts = [];

  for (const [name, count] of units) {
    const value = Math.floor(secondsValue / count);
    secondsValue %= count;

    if (value > 0 || parts.length === 0 && name === 'second') {
      parts.push(`${value} ${name}${value !== 1 ? 's' : ''}`);
    }
  }


  const res = parts.length > 1
      ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
      : parts[0] || '0 seconds';

  if (!withLabel) {
    return res;
  }

  return seconds >= 0 ? `in ${res}` : `${res} ago`;
}

export {
  alertMetaMaskMissing, formatDuration, getFirstAvailableAccount,
  getFirstConnectedAccount,
  showAlert, truncateAddress, truncateDecimals
};

