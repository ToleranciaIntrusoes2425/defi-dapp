import { nftContract, updateBalances, web3 } from './connection.js';
import { getFirstConnectedAccount, showAlert } from './utils.js';

async function mintNft() {
  const tokenURI = document.getElementById('nft-uri').value;
  if (!tokenURI) {
    // alert('Please enter a valid token URI');
    return;
  }

  const account = await getFirstConnectedAccount();
  if (!account) {
    // alert('Please connect your wallet first');
    return;
  }

  try {
    const mintPrice = await nftContract.methods.mintPrice().call();
    await nftContract.methods.mint(tokenURI).send({
      from: account,
      value: mintPrice
    });
    // alert('NFT minted successfully!');

    showAlert('NFT minted successfully!', 'success');
    await displayOwnedNFTs(account);
    await updateBalances(account);
  } catch (error) {
    console.error("Error minting NFT:", error);
    showAlert('Error minting NFT: ' + error.message, 'danger');
    // alert('Error minting NFT: ' + error.message);
  }
}

async function displayOwnedNFTs(account) {
  try {
    const tokenIds = await nftContract.methods.ownedTokens(account).call();
    const nftCollection = document.querySelector('.nft-collection');
    if (!nftCollection) return;

    nftCollection.innerHTML = '';

    if (tokenIds.length === 0) {
      nftCollection.innerHTML = '<p>No NFTs owned</p>';
      return;
    }

    for (const tokenId of tokenIds) {
      const tokenIdValue = parseInt(tokenId, 10);
      if (isNaN(tokenIdValue)) continue;

      const isGanache = (await web3.eth.getChainId()) == 1337;

      const tokenURI = isGanache
        ? 'Not available on Ganache'
        : await nftContract.methods.tokenURI(tokenIdValue).call();
      const owner = await nftContract.methods.ownerOf(tokenIdValue).call();
      if (owner.toLowerCase() === account.toLowerCase()) {
        const nftElement = document.createElement('div');
        nftElement.className = 'nft-item mb-3 p-3 border border-2 rounded';
        nftElement.innerHTML = `
          <p><strong>NFT ID:</strong> ${tokenIdValue}</p>
          <p><strong>URI:</strong> ${isGanache ? tokenURI : tokenURI.substring(0, 50) + "..."}</p>
          <button onclick="viewNftDetails(${tokenIdValue})" class="btn btn-sm btn-secondary">View Details</button>
        `;
        nftCollection.appendChild(nftElement);
      }
    }
  } catch (error) {
    console.error("Error fetching NFTs:", error);
  }
}

async function viewNftDetails(tokenId) {
  try {
    const isGanache = (await web3.eth.getChainId()) == 1337;
    const tokenURI = isGanache
      ? 'Not available on Ganache'
      : await nftContract.methods.tokenURI(tokenId).call();
    showAlert(`NFT ID: ${tokenId}\nURI: ${tokenURI}`);
    console.log(tokenURI)
  } catch (error) {
    console.error("Erro ao obter detalhes do NFT:", error);
    showAlert('Error fetching NFT details', 'danger');
  }
}

export { displayOwnedNFTs, mintNft, viewNftDetails };

