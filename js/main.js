import { checkAccountConnection, connectMetaMask } from './connection.js';
import { executeExchange, switchExchangeTokens, updateExchangeRate, updateSwapRate } from './exchange.js';
import { initLoanNotifications } from './loan.js';

window.connectMetaMask = connectMetaMask;
window.addEventListener('load', async () => {
  await checkAccountConnection();
  await initLoanNotifications();
  await updateSwapRate();
});

window.updateExchangeRate = updateExchangeRate;
window.switchExchangeTokens = switchExchangeTokens;
window.executeExchange = executeExchange;
