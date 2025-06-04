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
- ETH in the **Sepolia testnet** (get free ETH at: [Sepolia Faucet - Chainlink](https://faucets.chain.link/sepolia))
- Local HTTP server (e.g. `http-server`)
- A deployed version of the **DeFi contract** and the **NFT contract**

---

## Running the Project

### 1. Clone the Repository

Unzip or clone the project and open the root folder.

```bash
cd project2
```

---

### 2. Deploy Smart Contracts

Deploy both contracts to **Sepolia**:

1. Compile and deploy the `nft.sol` and `def.sol` contracts using **Remix**
2. Copy the deployed **contract addresses**

### 3. Update Frontend Configuration

Open the file:

```
/js/constants.js
```

Then **replace the following** with your deployed contract details:

```javascript
export const defiContractAddress = "0xYourDeployedDefiContractAddress";
export const nftContractAddress = "0xYourDeployedNFTContractAddress";
```

Optionally: 

---

### 5. Start Local Server

Run the server:

```bash
python3 -m http.server 8080
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

## Using Ganache

- **You may use Ganache network but the NFT token URIs won't work.**
- We provide a database with the contracts already deployed in /blockchain folder.
- The steps below were successfully on Linux, but not on Windows.
- The database may be corrupted, if that's the case you need to delete the /blockchain folder, deploy the contracts and update their addresses in constants.js.

### 1. Install Ganache
```
npm i -g ganache
```

### 2. Start the blockchain
```
./start-blockchain.sh
```

### 3. Account selection
Use one of the preloaded accounts in accounts-with-balance.txt for MetaMask.

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
├── blockchain/                   # Ganache blockchain data
│
├── frontend/
│   ├── index.html               # Main UI
│   └─── js/
│       ├── connection.js
│       ├── constants.js
│       ├── exchange.js
│       ├── lending.js
│       ├── loan.js
│       ├── main.js
│       ├── nft.js
│       ├── utils.js
│       ├── abi_defi.js          # ABI for DefiLoan
│       └── abi_nft.js             # ABI for NFT     
│
├── defi.sol                    # Defi contract
├── nft.md                    # Nft contract
└── README.md                    # This file
```
---

## References

- [ERC20 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
- [ERC721 Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Sepolia Faucet](https://faucets.chain.link/sepolia)

---
