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
    const balance = await nftContract.methods.balanceOf(account).call();
    const nftCollection = document.querySelector('.nft-collection');
    
    if (!nftCollection) return;
    
    nftCollection.innerHTML = '';
    
    if (balance === '0') {
      nftCollection.innerHTML = '<p>No NFTs owned</p>';
      return;
    }

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.methods.tokenOfOwnerByIndex(account, i).call();
      const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
      
      const nftElement = document.createElement('div');
      nftElement.className = 'nft-item mb-3 p-3 border rounded';
      nftElement.innerHTML = `
        <p><strong>NFT ID:</strong> ${tokenId}</p>
        <p><strong>URI:</strong> ${tokenURI.substring(0, 30)}...</p>
        <button onclick="viewNftDetails(${tokenId})" class="btn btn-sm btn-info">View Details</button>
      `;
      nftCollection.appendChild(nftElement);
    }
  } catch (error) {
    console.error("Error fetching NFTs:", error);
  }
}

async function viewNftDetails(tokenId) {
  try {
    const tokenURI = await nftContract.methods.tokenURI(tokenId).call();
    alert(`NFT Details:\nID: ${tokenId}\nURI: ${tokenURI}`);
  } catch (error) {
    console.error("Error fetching NFT details:", error);
  }
}

// Initialize NFT display when page loads
window.addEventListener('load', async () => {
  const account = await getFirstConnectedAccount();
  if (account) {
    await displayOwnedNFTs(account);
  }
});

window.mintNft = mintNft;
window.viewNftDetails = viewNftDetails;

export { displayOwnedNFTs };