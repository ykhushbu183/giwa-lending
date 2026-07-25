# GiwaLend

A decentralized lending & borrowing protocol on **GIWA Sepolia**. Supply GLT to earn 5% APY, borrow against collateral at 10% APR.

**Live App:** https://giwalend.vercel.app

---

## Architecture

```
┌─ Frontend (React + Vite) ─────────────────────┐
│  wagmi / viem → MetaMask | OKX | Trust | ...   │
│  Contract calls via ABI (readContract / write)  │
│  Toast notifications on tx lifecycle            │
└────────────────────────────────────────────────┘
        │
        ▼
┌─ GIWA Sepolia (Chain ID: 91342) ───────────────┐
│  GiwaToken (GLT)  — public mint                │
│  GiwaLendingPool  — deposit | borrow | repay    │
└────────────────────────────────────────────────┘
```

## Contracts

| Contract | Address |
|----------|---------|
| GLT Token | `0xCcB10752990A7508933d2fF509e011f71032073F` |
| Lending Pool | `0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA` |

## Features

- **Mint GLT** — Public mint, no faucet needed, only gas fees
- **Supply** — Deposit GLT to earn 5% APY (time-based interest)
- **Borrow** — Borrow up to 66% of supplied value at 10% APR (150% collateral ratio)
- **Repay / Withdraw** — Full loan management with real-time interest
- **Health Factor** — Visual gauge tracking collateralization
- **Wallet Panel** — Address copy, chain switch, ETH/GLT balances
- **Toast Notifications** — Pending → Success/Error with explorer link

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Web3:** Wagmi v2 + viem
- **Styling:** Tailwind CSS v4 + CSS variables
- **Routing:** React Router v7
- **Data:** @tanstack/react-query
- **Chain:** GIWA Sepolia (OP Stack L2)

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Deploy

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
