import { nftContract, web3, updateBalances } from './connection.js';
import { getFirstConnectedAccount } from './utils.js';

async function mintNft() {
  const tokenURI = document.getElementById('nft-uri').value;
  if (!tokenURI) {
    alert('Please enter a valid token URI');
    return;
  }

  const account = await getFirstConnectedAccount();
  if (!account) {
    alert('Please connect your wallet first');
    return;
  }

  try {
    const mintPrice = await nftContract.methods.mintPrice().call();
    await nftContract.methods.mint(tokenURI).send({
      from: account,
      value: mintPrice
    });
    alert('NFT minted successfully!');
    await displayOwnedNFTs(account);
    await updateBalances(account);
  } catch (error) {
    console.error("Error minting NFT:", error);
    alert('Error minting NFT: ' + error.message);
  }
}

async function displayOwnedNFTs(account) {
  try {
    const tokenIds = await nftContract.methods.tokensOfOwner(account).call();
    const nftCollection = document.querySelector('.nft-collection');
    if (!nftCollection) return;

    nftCollection.innerHTML = '';

    if (tokenIds.length === 0) {
      nftCollection.innerHTML = '<p>No NFTs owned</p>';
      return;
    }

    for (const tokenId of tokenIds) {
      const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
      const owner = await nftContract.methods.ownerOf(tokenId).call();
      if (owner.toLowerCase() === account.toLowerCase()) {
        const nftElement = document.createElement('div');
        nftElement.className = 'nft-item mb-3 p-3 border rounded';
        nftElement.innerHTML = `
          <p><strong>NFT ID:</strong> ${tokenId}</p>
          <p><strong>URI:</strong> ${tokenURI.substring(0, 50)}...</p>
          <button onclick="viewNftDetails(${tokenId})" class="btn btn-sm btn-info">View Details</button>
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
    const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
    alert(`NFT ID: ${tokenId}\nURI: ${tokenURI}`);
    console.log(tokenURI)
  } catch (error) {
    console.error("Erro ao obter detalhes do NFT:", error);
    alert("Error obtaining details of the NFT.");
  }
}

window.mintNft = mintNft;
window.viewNftDetails = viewNftDetails;

export { displayOwnedNFTs };