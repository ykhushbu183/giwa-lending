# GiwaLend

A **Dojang-attested** lending & borrowing protocol on **GIWA Sepolia**. Only wallets with a valid Upbit Korea KYC attestation can supply GLT (5% APY) and borrow against collateral (10% APR).

**Live App:** https://giwalend.vercel.app

---

## Architecture

```
┌─ Frontend ─────────────────────────────────────┐
│  Connect → Dojang KYC check → Access App       │
│  wagmi + viem → contract calls                 │
└───────────────────────┬────────────────────────┘
                        │
┌─ Dojang (GIWA KYC) ──▼────────────────────────┐
│  DojangScroll.isVerified() — EAS attestation   │
│  Checks: Upbit Korea attester ID               │
└───────────────────────┬────────────────────────┘
                        │
┌─ Contracts ───────────▼────────────────────────┐
│  GiwaToken.sol         — ERC20 with public mint│
│  GiwaLendingPool.sol   — deposit/borrow/repay  │
└───────────────────────┬────────────────────────┘
                        │
┌─ GIWA Sepolia (91342) ▼────────────────────────┐
│  GLT Token:    0xCcB1...                      │
│  Lending Pool: 0x4C62...                      │
└────────────────────────────────────────────────┘
```

## Contracts

| Contract | Address |
|----------|---------|
| **DojangScroll** | `0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9` |
| **GLT Token** | `0x8dcDbfaD3869515f82177Bb491Ae83198d91d807` |
| **Lending Pool** | `0x808D093E87A3FD286115738BeE9babD8ECEf21b3` |

### DojangScroll (KYC)
- `isVerified(address, bytes32 attesterId)` — Check wallet has Upbit Korea KYC attestation
- Attester ID: `0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034`
- EAS contract: `0x4200000000000000000000000000000000000021`

### GiwaToken
- `mint(uint256)` — Public mint (KYC-gated on frontend)

### GiwaLendingPool
- `deposit(uint256)` / `withdraw(uint256)` — Supply & earn 5% APY
- `borrow(uint256)` / `repay(uint256)` — Borrow at 10% APR (150% collateral ratio)

## Features

- **KYC Gating** — Only wallets with a Dojang attestation (Upbit Korea KYC) can access lending/borrowing
- **Mint GLT** — Public mint, only gas fees (Dojang-verified wallets only)
- **Supply** — 5% APY, time-based interest
- **Borrow** — 10% APR, 150% collateral ratio, max 66% LTV
- **Wallet Panel** — Address copy, chain switch, ETH/GLT balances
- **Toast Notifications** — Pending → Success/Error with explorer link
- **Health Factor** — Visual gauge tracking position health

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20 + Foundry |
| Frontend | React 18 + TypeScript + Vite |
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
