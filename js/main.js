import { changeRate, checkAccountConnection, connectMetaMask, } from './connection.js';
import { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate } from './exchange.js';
import { createLoan, createNftLoan, initLoanNotifications, makePayment, terminateLoan } from './loan.js';
import { mintNft, viewNftDetails } from './nft.js';

window.connectMetaMask = connectMetaMask;

if (document.readyState === 'complete') {
  (async () => {
    await checkAccountConnection();
    await initLoanNotifications();
    await updateSwapRate();
  })();
} else {
  window.addEventListener('load', async () => {
    await checkAccountConnection();
    await initLoanNotifications();
    await updateSwapRate();
  });
}

window.createNftLoan = createNftLoan;
window.createLoan = createLoan;
window.changeRate = changeRate;
window.updateExchangeRate = updateExchangeRate;
window.switchExchangeTokens = switchExchangeTokens;
window.executeExchange = executeExchange;
window.mintNft = mintNft;
window.viewNftDetails = viewNftDetails;
window.makePayment = makePayment;
window.terminateLoan = terminateLoan;
