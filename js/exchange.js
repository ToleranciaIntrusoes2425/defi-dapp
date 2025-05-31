import { defiContract, web3 } from './connection.js';
import { getFirstConnectedAccount } from './utils.js';

function getTokenElements() {
  return {
    fromTokenElement: document.getElementById('from-token'),
    toTokenElement: document.getElementById('to-token'),
    fromAmountElement: document.getElementById('from-amount'),
    toAmountElement: document.getElementById('to-amount')
  };
}

async function updateSwapRate(){
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
    alert('Cannot exchange the same token.');
    return;
  }
  
  const dexPriceInWei  = await defiContract.methods.dexSwapRate().call();
  const dexPrice = web3.utils.fromWei(dexPriceInWei, 'ether');
  const fromAmount = parseFloat(fromAmountElement.value);
  if (isNaN(fromAmount) || fromAmount <= 0) return;

  try {
    if (target.id === 'from-amount' || target.id === 'from-token') {
      if (fromToken === 'DEX' && toToken === 'Wei') {
        toAmountElement.value = (fromAmount * dexPrice).toFixed(4);
      } else if (fromToken === 'Wei' && toToken === 'DEX') {
        toAmountElement.value = (fromAmount / dexPrice).toFixed(4);
      } else {
        toAmountElement.value = '';
      }
    } else if (target.id === 'to-amount' || target.id === 'to-token') {
      if (toToken === 'DEX' && fromToken === 'Wei') {
        fromAmountElement.value = (parseFloat(toAmountElement.value) / dexPrice).toFixed(4);
      } else if (toToken === 'Wei' && fromToken === 'DEX') {
        fromAmountElement.value = (parseFloat(toAmountElement.value) * dexPrice).toFixed(4);
      } else {
        fromAmountElement.value = '';
      }
    }
  } catch (error) {
    console.error("Error updating exchange rate:", error);
    alert('Error getting exchange rate: ' + error.message);
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

  const { fromTokenElement, toTokenElement, fromAmountElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const fromAmount = fromAmountElement.value;

  if (fromAmount <= 0) {
    alert('Please enter a valid amount');
    return;
  }

  try {
    if (fromToken === 'DEX') {
      await defiContract.methods.sellDex(web3.utils.toWei(fromAmount, 'ether')).send({
        from: account
      });
      alert(`Successfully sold ${fromAmount} DEX`);
    } else {
      await defiContract.methods.buyDex().send({
        from: account,
        value: web3.utils.toWei(fromAmount, 'ether')
      });
      alert(`Successfully bought ${fromAmount} DEX`);
    }
    
    // Refresh balances
    await updateBalances(account);
  } catch (error) {
    console.error("Error executing exchange:", error);
    alert('Error executing exchange: ' + error.message);
  }
}

export { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate };