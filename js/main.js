import { checkAccountConnection, connectMetaMask } from './connection.js';
import { executeExchange, switchExchangeTokens, updateExchangeRate } from './exchange.js';

window.connectMetaMask = connectMetaMask;
window.addEventListener('load', checkAccountConnection);

window.updateExchangeRate = updateExchangeRate;
window.switchExchangeTokens = switchExchangeTokens;
window.executeExchange = executeExchange;
