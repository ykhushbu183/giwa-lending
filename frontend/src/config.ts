export const GIWA = 91342

export const TOKEN = "0xCcB10752990A7508933d2fF509e011f71032073F"
export const POOL = "0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA"
export const DOJANG_SCROLL = "0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9"
export const UPBIT_ATTESTER = "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034"

export const GIWA_CHAIN = {
  id: GIWA,
  name: "GIWA Sepolia",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rpc.giwa.io"] },
  },
  blockExplorers: {
    default: { name: "GIWA Explorer", url: "https://sepolia-explorer.giwa.io" },
  },
}

export const GIWA_NET = {
  chainId: "0x" + GIWA.toString(16),
  chainName: "GIWA Sepolia",
  rpcUrls: ["https://sepolia-rpc.giwa.io"],
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia-explorer.giwa.io"],
}

export const TOKEN_ABI = [
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
] as const

export const POOL_ABI = [
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "borrow", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "repay", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "totalDeposits", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBorrows", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserInfo", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPoolStats", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const

export const DOJANG_ABI = [
  { inputs: [{ internalType: "address", name: "addr", type: "address" }, { internalType: "bytes32", name: "attesterId", type: "bytes32" }], name: "isVerified", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
] as const

export function fmt(v: string | bigint, d = 2, showSign = false) {
  const n = typeof v === "bigint" ? Number(v) / 1e18 : Number(v) / 1e18
  if (n === 0) return "0"
  if (n < 0.01) return "<0.01"
  const prefix = showSign && n > 0 ? "+" : ""
  return prefix + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: d })
}

export function toB(v: string) {
  const c = v.replace(/,/g, "")
  if (!c || isNaN(Number(c))) return BigInt(0)
  try {
    return BigInt(Math.floor(Number(c) * 1e18))
  } catch {
    return BigInt(0)
  }
}

export function calcHealth(deposits: bigint, borrows: bigint) {
  const d = Number(deposits)
  const b = Number(borrows)
  if (d === 0 || b === 0) return { pct: 100, color: "var(--accent-green)", label: "Safe" }
  const r = Math.min((d * 100) / (b * 1.5), 100)
  return {
    pct: Math.round(r),
    color: r > 80 ? "var(--accent-green)" : r > 50 ? "var(--accent-yellow)" : "var(--accent-red)",
    label: r > 80 ? "Safe" : r > 50 ? "Fair" : "Risk",
  }
}
