function getTokenElements() {
  const fromTokenElement = document.getElementById('from-token');
  const toTokenElement = document.getElementById('to-token');
  return { fromTokenElement, toTokenElement };
}

function updateExchangeTokens(event, mode) {
  if (mode !== 'from' && mode !== 'to') {
    console.error('Invalid mode. Use \'from\' or \'to\'.');
    return;
  }

  const { fromTokenElement, toTokenElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (fromToken !== toToken) {
    return;
  }

  if (mode === 'from') {
    if (fromToken === 'TMZ') {
      toTokenElement.value = 'ETH';
    } else if (fromToken === 'ETH') {
      toTokenElement.value = 'TMZ';
    }
  } else if (mode === 'to') {
    if (toToken === 'TMZ') {
      fromTokenElement.value = 'ETH';
    } else if (toToken === 'ETH') {
      fromTokenElement.value = 'TMZ';
    }
  }
}

function switchExchangeTokens(event) {
  let target = null;
  if (event && event.type === 'change') {
    target = event.target;
  }

  const { fromTokenElement, toTokenElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (!target) {
    fromTokenElement.value = toToken;
    toTokenElement.value = fromToken;
  } else if (target.id === 'from-token') {
    toTokenElement.value = toToken === 'TKZ' ? 'ETH' : 'TKZ';
  } else if (target.id === 'to-token') {
    fromTokenElement.value = fromToken === 'TKZ' ? 'ETH' : 'TKZ';
  }
}

function executeExchange(event) {
  if (event) {
    event.preventDefault();
  }

  const { fromTokenElement, toTokenElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (fromToken === toToken) {
    console.error('Cannot exchange the same token.');
    return;
  }

  // TODO: Implement
}

window.updateExchangeTokens = updateExchangeTokens;
window.switchExchangeTokens = switchExchangeTokens;
window.executeExchange = executeExchange;
