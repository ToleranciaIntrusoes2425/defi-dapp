import { checkAccountConnection, connectMetaMask, changeRate, } from './connection.js';
import { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate } from './exchange.js';
import { initLoanNotifications, createLoan } from './loan.js';

window.connectMetaMask = connectMetaMask;
window.addEventListener('load', async () => {
  await checkAccountConnection();
  await initLoanNotifications();
  await updateSwapRate();
});

window.createLoan = createLoan;
window.changeRate = changeRate;
window.updateExchangeRate = updateExchangeRate;
window.switchExchangeTokens = switchExchangeTokens;
window.executeExchange = executeExchange;
