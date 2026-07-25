# GiwaLend

A decentralized lending & borrowing protocol on **GIWA Sepolia**. Supply GLT to earn 5% APY, borrow against collateral at 10% APR.

**Live App:** https://giwalend.vercel.app

---

## Architecture

```
┌─ Frontend (React + Vite) ─────────────────────┐
│  wagmi / viem → wallet connectors (MetaMask…)  │
│  readContract / writeContract → onchain calls   │
│  Toast notifications on tx lifecycle            │
└───────────────────────┬────────────────────────┘
                        │
┌─ Contracts (Solidity) ▼────────────────────────┐
│  GiwaToken.sol         — ERC20 with public mint│
│  GiwaLendingPool.sol   — deposit/borrow/repay  │
└───────────────────────┬────────────────────────┘
                        │
┌─ GIWA Sepolia (91342) ▼────────────────────────┐
│  GLT Token:  0xCcB1...                      │
│  LendingPool: 0x4C62...                      │
└────────────────────────────────────────────────┘
```

## Contracts

| Contract | Address |
|----------|---------|
| **GLT Token** | `0xCcB10752990A7508933d2fF509e011f71032073F` |
| **Lending Pool** | `0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA` |

### GiwaToken
- `mint(uint256 amount)` — Public mint, anyone can mint GLT
- `transfer`, `approve`, `transferFrom` — Standard ERC20

### GiwaLendingPool
- `deposit(uint256)` — Supply GLT, starts earning 5% APY
- `withdraw(uint256)` — Withdraw + accrued interest
- `borrow(uint256)` — Borrow against collateral (150% ratio)
- `repay(uint256)` — Repay loan + accrued interest
- `getUserInfo(address)` — Position + interest details
- `getPoolStats()` — Total deposits, borrows, utilization

## Features

- **Mint GLT** — Public mint, no faucet, only gas fees
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
# Install dependencies
forge install

# Build
forge build

# Test
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

## Deployment

```bash
cd frontend
npx vercel --prod
```

## Links

| Resource | URL |
|----------|-----|
| Live App | https://giwalend.vercel.app |
| Explorer | https://sepolia-explorer.giwa.io |
| Faucet | https://faucet.giwa.io |

## License

MIT — built for GASOK 2026
