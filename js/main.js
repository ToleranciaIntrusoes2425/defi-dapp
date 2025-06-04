import { changeRate, checkAccountConnection, connectMetaMask, updateUI } from './connection.js';
import { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate } from './exchange.js';
import { lendToNftLoan } from './lending.js';
import { cancelNftLoan, checkAllLoans, createLoan, createNftLoan, initLoanNotifications, makePayment, populateLoanRates, terminateLoan } from './loan.js';
import { mintNft, viewNftDetails } from './nft.js';


if (document.readyState === 'complete') {
  (async () => {
    document.querySelector(".wallet-connect-btn")?.addEventListener("click", connectMetaMask);
    await checkAccountConnection();
    await initLoanNotifications();
    await updateSwapRate();
    await populateLoanRates();
    
    setInterval(async () => {
      await checkAllLoans();
    }, 10 * 60 * 1000);
  })();
} else {
  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelector(".wallet-connect-btn")?.addEventListener("click", connectMetaMask);
    await checkAccountConnection();
    await initLoanNotifications();
    await updateSwapRate();
    await populateLoanRates();

    setInterval(async () => {
      await checkAllLoans();
    }, 10 * 60 * 1000);
  });
}

window.ethereum.on('accountsChanged', (_) => {
  window.location.reload();
});

window.connectMetaMask = connectMetaMask;
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
window.lendToNftLoan = lendToNftLoan;
window.checkAllLoans = checkAllLoans;
window.cancelNftLoan = cancelNftLoan;
