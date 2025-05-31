import { defiContract } from "./connection.js";
import { getFirstConnectedAccount } from "./utils.js";

function getTokenElements() {
  const fromTokenElement = document.getElementById('from-token');
  const toTokenElement = document.getElementById('to-token');
  return { fromTokenElement, toTokenElement };
}

function getAmountElements() {
  const fromAmountElement = document.getElementById('from-amount');
  const toAmountElement = document.getElementById('to-amount');
  return { fromAmountElement, toAmountElement };
}

async function updateExchangeRate(event) {
  if (!event || event.type !== 'change') {
    return;
  }

  const target = event.target;

  if (target.id !== 'from-amount' && target.id !== 'to-amount') {
    console.error('Invalid event target:', target.id);
    return;
  }

  const { fromTokenElement, toTokenElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (fromToken === toToken) {
    console.error('Cannot exchange the same token.');
    return;
  }

  const { fromAmountElement, toAmountElement } = getAmountElements();
  const fromAmount = fromAmountElement.value;
  const toAmount = toAmountElement.value;

  if (fromAmount < 0 || toAmount < 0) { // TODO: Check if this is correct
    console.error('Invalid token amounts:', fromAmount, toAmount);
    return;
  }

  try {
    const dexPrice = await defiContract.methods.dexSwapRate().call();

    if (!dexPrice || isNaN(dexPrice)) {
      console.error('Invalid exchange rate:', dexPrice);
      return;
    }

    console.log(`Exchange rate: 1 DEX = ${dexPrice} Wei`);

    if (target.id === 'from-amount') {
      if (fromToken === 'DEX') {
        toAmountElement.value = fromAmount * dexPrice;
      } else if (fromToken === 'Wei') {
        toAmountElement.value = ~~(fromAmount / dexPrice);
      }
    } else if (target.id === 'to-amount') {
      if (toToken === 'DEX') {
        fromAmountElement.value = toAmount * dexPrice;
      } else if (toToken === 'Wei') {
        fromAmountElement.value = ~~(toAmount * dexPrice);
      }
    }
  } catch (error) {
    console.error("Error updating exchange rate:", error);
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

  const { fromAmountElement, toAmountElement } = getAmountElements();
  const fromAmount = fromAmountElement.value;
  const toAmount = toAmountElement.value;

  if (!target) {
    fromTokenElement.value = toToken;
    toTokenElement.value = fromToken;
  } else if (target.id === 'from-token') {
    toTokenElement.value = toToken === 'DEX' ? 'Wei' : 'DEX';
  } else if (target.id === 'to-token') {
    fromTokenElement.value = fromToken === 'DEX' ? 'Wei' : 'DEX';
  }

  fromAmountElement.value = toAmount;
  toAmountElement.value = fromAmount;
}

async function executeExchange(event) {
  console.log('Executing exchange...');

  if (event) {
    event.preventDefault();
  }

  const fromAddress = await getFirstConnectedAccount();
  if (!fromAddress) {
    console.error('No connected accounts found.');
    return;
  }

  const { fromTokenElement, toTokenElement } = getTokenElements();
  const fromToken = fromTokenElement.value;
  const toToken = toTokenElement.value;

  if (fromToken === toToken) {
    console.error('Cannot exchange the same token.');
    return;
  }

  const { fromAmountElement, toAmountElement } = getAmountElements();
  const fromAmount = fromAmountElement.value;
  const toAmount = toAmountElement.value;

  if (fromAmount <= 0 || toAmount <= 0) {
    console.error('Invalid token amounts.');
    return;
  }

  try {
    if (fromToken === 'DEX') {
      await defiContract.methods.sellDex(fromAmount).send({
        from: fromAddress,
      });
      console.log(`Sold ${toAmount} DEX for ${fromAmount} Wei`);
    } else if (fromToken === 'Wei') {
      await defiContract.methods.buyDex().send({
        from: fromAddress,
        value: fromAmount,
      });
      console.log(`Bought ${toAmount} DEX for ${fromAmount} Wei`);
    }
  } catch (error) {
    console.error("Error setting price:", error);
  }
}

export { executeExchange, switchExchangeTokens, updateExchangeRate };

