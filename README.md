# 🏦 GiwaLend — KYC-Gated Lending Protocol on GIWA Chain

Built for **GASOK 2026** — GIWA Builder Program

## Overview

GiwaLend is a decentralized lending and borrowing protocol on GIWA Chain (Ethereum L2, OP Stack). Only **Upbit KYC-verified wallets** can deposit, lend, and borrow tokens — ensuring a sybil-resistant, compliant DeFi ecosystem.

## Features

- ✅ **KYC-Gated Access** — Uses GIWA's Dojang attestation system
- ✅ **Deposit & Lend** — Earn 5% APY on deposits
- ✅ **Borrow** — Borrow up to 66% of collateral (150% collateral ratio)
- ✅ **Interest Calculation** — Time-based interest (per second)
- ✅ **Testnet Ready** — Deployed on GIWA Sepolia

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Chain | GIWA Sepolia (Ethereum L2, OP Stack) |
| Smart Contract | Solidity 0.8.20 |
| Frontend | React + TypeScript + Vite |
| Web3 | viem + wagmi |
| KYC | Dojang / EAS Attestation |

## Smart Contract

**GiwaLendingPool.sol** — `0x...` (deployed on GIWA Sepolia)

### Functions

| Function | Description |
|----------|-------------|
| `deposit(amount)` | Deposit VerifiedToken (KYC required) |
| `withdraw(amount)` | Withdraw + earned interest |
| `borrow(amount)` | Borrow against collateral (KYC required) |
| `repay(amount)` | Repay loan + interest |
| `getPoolStats()` | View total deposits, borrows, utilization |
| `getUserInfo(address)` | View user position + interest |

## Frontend

- Wallet connect (MetaMask)
- KYC status check via Dojang
- Pool statistics dashboard
- Deposit / Withdraw / Borrow / Repay UI
- Dark theme (GitHub-inspired)

## How to Run

```bash
cd frontend
npm install
npm run dev
```

## Links

- **GIWA Testnet Faucet:** https://faucet.giwa.io
- **GIWA Sepolia Explorer:** https://sepolia-explorer.giwa.io
- **VerifiedToken:** `0xBCdB22f56642DE57624CfC2fBb9eE398cF3CA268`
- **DojangScroll:** `0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9`

## GASOK Submission

- **Track:** DeFi / RWA
- **Team:** Tushar Yadav (ykhushbu183)
- **Status:** Submitted
