# Decentralized Finance DApp — ETH, DEX & NFT Loans

**Course**: Intrusion (Detection and) Tolerance — DI-FCUL  
**Academic Year**: 2024/2025  
**Project**: 2 — Decentralized Finance (DeFi)  
**Group Members**:
- Tiago Santos — 64586
- Manuel Gonçalves — 58555
- Leonardo Fernandes — 64597

---

## Project Summary

This decentralized application (DApp) allows users to:

- Buy and sell a custom ERC20 token called **DEX**
- Request ETH loans using **DEX** tokens or **NFTs** as collateral
- Participate as lenders by funding NFT-backed loans
- Pay interest and redeem collaterals
- View loan status, token balances, and interact with the system through MetaMask

The platform uses:
- Two Smart Contracts: one for the **DeFi logic** and one for the **NFT system**
- A web interface with HTML/JS using **Web3.js**
- The **Sepolia testnet** or **Ganache local blockchain**

---

## Requirements

To run this project, you will need:

- A crypto wallet like [MetaMask](https://metamask.io/)
- ETH in the **Sepolia testnet**  
  (get free ETH at: [Sepolia Faucet - Chainlink](https://faucets.chain.link/sepolia))
- [Node.js](https://nodejs.org/) and a local HTTP server (e.g. `http-server`)
- A deployed version of the **DeFi contract** and the **NFT contract**

---

## Running the Project

### 1. Clone the Repository

Unzip or clone the project and open the root folder.

```bash
cd project2
```

---

### 2. Install Web3.js (if not already available)

```bash
npm install web3
```

Or use the CDN version (already included in the HTML):

```html
<script src="https://cdn.jsdelivr.net/npm/web3@1.8.2/dist/web3.min.js"></script>
```

---

### 3. Deploy Smart Contracts

Deploy both contracts to **Sepolia** or **Ganache**:

1. Compile and deploy the `NFT.sol` and `DefiLoan.sol` contracts using **Remix**
2. Copy the deployed **contract addresses**
3. Export the **ABIs** from Remix

---

### 4. Update Frontend Configuration

Open the files:

```
/js/constants.js
/js/abi_defi.js
/js/abi_nft.js
```

Then **replace the following** with your deployed contract details:

```javascript
export const defiContractAddress = "0xYourDeployedDefiLoanAddress";
export const nftContractAddress = "0xYourDeployedNFTAddress";
export const defiAbi = [ ... ]; // Replace with ABI of DefiLoan contract
export const nftAbi = [ ... ];  // Replace with ABI of NFT contract
```

> Both address and ABI are required for the dApp to communicate with the contracts.

---

### 5. Start Local Server

Use `http-server` or Python to run a local server:

```bash
npx http-server
```

or

```bash
python3 -m http.server
```

Then open the app in your browser:
```
http://localhost:8080
```

---

### 6. Connect MetaMask

- Make sure MetaMask is connected to the **same network** where you deployed the contracts (e.g., Sepolia).
- Click "Connect Wallet" on the dApp interface.

---

## Features Overview

### For General Users
- Connect wallet and interact with blockchain
- Buy and sell **DEX tokens**
- Request ETH loans with DEX or NFT as collateral
- View their balances (DEX, ETH)
- View available NFT loan requests and become lenders
- Pay back loans or make periodic interest payments

### For Contract Owner
- View contract ETH balance
- Call `checkLoan()` every 10 minutes (recommended manually or automated)
- View loan creation events via `loanCreated(...)`

---

## Project Structure (simplified)

```
project2/
│
├── contracts/                   # Solidity smart contracts
│   ├── defi.sol
│   └── nft.sol
│
├── frontend/
│   ├── index.html               # Main UI
│   └─── js/
│       ├── constants.js         # <-- Update addresses and ABIs here
│       ├── abi_defi.js          # ABI for DefiLoan
│       └── abi_nft.js             # ABI for NFT     
│
└── README.md                    # This file
```
---

## References

- [ERC20 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
- [ERC721 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Sepolia Faucet](https://faucets.chain.link/sepolia)

---
