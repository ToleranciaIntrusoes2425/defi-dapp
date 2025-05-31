import { defiContract } from './connection.js';
import { getFirstConnectedAccount } from './utils.js';

async function initLoanNotifications() {
  const owner = await defiContract.methods.owner().call();
  const userAddress = await getFirstConnectedAccount();

  if (userAddress?.toLowerCase() === owner?.toLowerCase()) {
    defiContract.events.loanCreated({
      fromBlock: 'latest'
    })
      .on('data', event => {
        console.log('New loan:', event.returnValues);
      })
      .on('error', console.error);
  } else {
    console.log("You're not the owner of the contract.");
  }
}

export {
  initLoanNotifications
};

