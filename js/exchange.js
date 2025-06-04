import { defiContract, updateBalances, web3 } from './connection.js';
import { getFirstConnectedAccount, showAlert } from './utils.js';

function getTokenElements() {
  return {
    fromTokenElement: document.getElementById('from-token'),
    toTokenElement: document.getElementById('to-token'),
    fromAmountElement: document.getElementById('from-amount'),
    toAmountElement: document.getElementById('to-amount')
  };
}

async function updateSwapRate() {
  const dexPrice = await defiContract.methods.dexSwapRate().call();
  document.querySelector('#exchange-rate').textContent = dexPrice;
}

async function updateExchangeRate(event) {
  if (!event || event.type !== 'change') return;

  const target = event.target;
  const { fromTokenElement, toTokenElement, fromAmountElement, toAmountElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (fromToken === toToken) {
    return;
  }

  const dexPriceInWei = await defiContract.methods.dexSwapRate().call();
  const dexPrice = web3.utils.fromWei(dexPriceInWei, 'ether');
  
  let amount = 0;
  if (target.id === 'from-amount' || target.id === 'from-token') {
    amount = parseFloat(fromAmountElement.value);
  } else if (target.id === 'to-amount' || target.id === 'to-token') {
    amount = parseFloat(toAmountElement.value);
  }

  if (isNaN(amount) || amount <= 0) return;

  try {
    if (target.id === 'from-amount' || target.id === 'from-token') {
      if (fromToken === 'DEX' && toToken === 'ETH') {
        toAmountElement.value = (amount * dexPrice).toFixed(18);
      } else if (fromToken === 'ETH' && toToken === 'DEX') {
        toAmountElement.value = Math.floor(amount / dexPrice);
      } else {
        toAmountElement.value = '';
      }
    } else if (target.id === 'to-amount' || target.id === 'to-token') {
      if (toToken === 'DEX' && fromToken === 'ETH') {
        fromAmountElement.value = (amount * dexPrice).toFixed(18);
      } else if (toToken === 'ETH' && fromToken === 'DEX') {
        fromAmountElement.value = Math.floor(amount / dexPrice);
      } else {
        fromAmountElement.value = '';
      }
    }
  } catch (error) {
    console.error("Error updating exchange rate:", error);
  }
}

function switchExchangeTokens(event) {
  const { fromTokenElement, toTokenElement, fromAmountElement, toAmountElement } = getTokenElements();

  // Swap token selections
  const temp = fromTokenElement.value;
  fromTokenElement.value = toTokenElement.value;
  toTokenElement.value = temp;

  // Swap amounts
  const tempAmount = fromAmountElement.value;
  fromAmountElement.value = toAmountElement.value;
  toAmountElement.value = tempAmount;
}

async function executeExchange(event) {
  event.preventDefault();

  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  const { toTokenElement, fromAmountElement, toAmountElement } = getTokenElements();
  const toToken = toTokenElement.value;
  const fromAmount = fromAmountElement.value;
  const toAmount = toAmountElement.value;

  if (toAmount <= 0) {
    return;
  }

  try {
    if (toToken === 'DEX') {
      await defiContract.methods.buyDex().send({
        from: account,
        value: web3.utils.toWei(fromAmount, 'ether')
      });
      showAlert(`Successfully bought ${toAmount} DEX`, 'success');
    } else {
      await defiContract.methods.sellDex(fromAmount).send({
        from: account
      });
      showAlert(`Successfully sold ${fromAmount} DEX`, 'success');
    }

    // Refresh balances
    await updateBalances(account);
  } catch (error) {
    console.error("Error executing exchange:", error);
    showAlert(`Exchange failed`, 'danger');
  }
}

export { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate };
