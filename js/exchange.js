import { defiContract, web3 } from "./connection.js";
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

  // if (fromAmount <= 0 || toAmount <= 0) {
  //   console.error('Invalid token amounts.');
  //   return;
  // }

  try {
    const tkzPrice = await defiContract.methods.dexSwapRate().call();

    let toAmount = 0;
    if (fromToken === 'TKZ') {
      toAmount = fromAmount * tkzPrice;
    } else if (fromToken === 'Wei') {
      toAmount = ~~(fromAmount / tkzPrice);
    }

    toAmountElement.value = toAmount;
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
    toTokenElement.value = toToken === 'TKZ' ? 'Wei' : 'TKZ';
  } else if (target.id === 'to-token') {
    fromTokenElement.value = fromToken === 'TKZ' ? 'Wei' : 'TKZ';
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
    if (fromToken === 'TKZ') {
      await defiContract.methods.buyDex().send({
        from: fromAddress,
        value: fromAmount,
      });
      console.log(`Bought ${fromAmount} TKZ for ${toAmount} Wei`);
    } else if (fromToken === 'Wei') {
      await defiContract.methods.sellDex(toAmount).send({
        from: fromAddress,
      });
      console.log(`Sold ${toAmount} TKZ for ${fromAmount} Wei`);
    }
  } catch (error) {
    console.error("Error setting price:", error);
  }
}

export { executeExchange, switchExchangeTokens, updateExchangeRate };

