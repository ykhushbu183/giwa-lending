# GiwaLend

A **KYC-gated** lending & borrowing protocol on **GIWA Sepolia**. Only verified wallets can supply GLT (5% APY) and borrow against collateral (10% APR).

**Live App:** https://giwalend.vercel.app

---

## Architecture

```
┌─ Frontend ─────────────────────────────────────┐
│  Connect → KYC check → Access Market/Dashboard │
│  wagmi + viem → contract calls                 │
└───────────────────────┬────────────────────────┘
                        │
┌─ Contracts ───────────▼────────────────────────┐
│  KycRegistry.sol       — verified address list │
│  GiwaToken.sol         — ERC20 with public mint│
│  GiwaLendingPool.sol   — deposit/borrow/repay  │
└───────────────────────┬────────────────────────┘
                        │
┌─ GIWA Sepolia (91342) ▼────────────────────────┐
│  KycRegistry: 0x416E...                      │
│  GLT Token:    0xCcB1...                      │
│  Lending Pool: 0x4C62...                      │
└────────────────────────────────────────────────┘
```

## Contracts

| Contract | Address |
|----------|---------|
| **KycRegistry** | `0x416Ec231d556AA51a5af5621C87Aa54a589b20F2` |
| **GLT Token** | `0xCcB10752990A7508933d2fF509e011f71032073F` |
| **Lending Pool** | `0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA` |

### KycRegistry
- `isVerified(address)` — Check if wallet is KYC-approved
- `addVerified(address)` — Owner-only: add to verified list
- `addBatch(address[])` — Owner-only: batch add
- `removeVerified(address)` — Owner-only: remove from list

### GiwaToken
- `mint(uint256)` — Public mint (KYC-gated on frontend)

### GiwaLendingPool
- `deposit(uint256)` / `withdraw(uint256)` — Supply & earn 5% APY
- `borrow(uint256)` / `repay(uint256)` — Borrow at 10% APR (150% collateral ratio)

## Features

- **KYC Gating** — Only verified wallets can access lending/borrowing
- **Mint GLT** — Public mint, only gas fees
- **Supply** — 5% APY, time-based interest
- **Borrow** — 10% APR, 150% collateral ratio, max 66% LTV
- **Wallet Panel** — Address copy, chain switch, ETH/GLT balances
- **Toast Notifications** — Pending → Success/Error with explorer link
- **Health Factor** — Visual gauge tracking position health

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20 + Foundry |
| Frontend | React 19 + TypeScript + Vite |
| Web3 | Wagmi v2 + viem |
| Styling | Tailwind CSS v4 |
| Data | @tanstack/react-query |
| Chain | GIWA Sepolia (OP Stack L2) |

## Quick Start

### Contracts

```bash
forge install
forge build
forge test

# Deploy (requires DEPLOYER_KEY env)
forge script script/Deploy.s.sol --rpc-url giwa_sepolia --broadcast --verify
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Links

| Resource | URL |
|----------|-----|
| Live App | https://giwalend.vercel.app |
| Explorer | https://sepolia-explorer.giwa.io |
| Faucet | https://faucet.giwa.io |

## License

MIT — built for GASOK 2026
