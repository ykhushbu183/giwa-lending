import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { giwaSepolia } from "viem/chains";

const GIWA_CHAIN_ID = 91342;
const TOKEN = "0xCcB10752990A7508933d2fF509e011f71032073F";
const POOL = "0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA";

const tokenAbi = [
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ internalType: "uint8", name: "", type: "uint8" }], stateMutability: "view", type: "function" },
];

const poolAbi = [
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "borrow", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "repay", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "totalDeposits", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBorrows", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserInfo", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPoolStats", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
];

const publicClient = createPublicClient({ chain: giwaSepolia, transport: http() });

const GIWA_NETWORK = {
  chainId: "0x" + GIWA_CHAIN_ID.toString(16),
  chainName: "GIWA Sepolia",
  rpcUrls: ["https://sepolia-rpc.giwa.io"],
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia-explorer.giwa.io"],
};

const formatter = (val: string, decimals = 2) => {
  const n = Number(val) / 1e18;
  if (n === 0) return "0";
  if (n < 0.001) return "<0.001";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: decimals });
};

const toWei = (val: string) => {
  const c = val.replace(/,/g, "");
  if (!c || isNaN(Number(c))) return BigInt(0);
  return BigInt(Math.floor(Number(c) * 1e18));
};

type Tab = "dashboard" | "market";
type Action = "supply" | "withdraw" | "borrow" | "repay";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("gl-theme") || "dark");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
  const [symbol, setSymbol] = useState("GLT");
  const [balance, setBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [tDeposits, setTDeposits] = useState("0");
  const [tBorrows, setTBorrows] = useState("0");
  const [util, setUtil] = useState("0");
  const [uDeposits, setUDeposits] = useState("0");
  const [uBorrows, setUBorrows] = useState("0");
  const [uCollateral, setUCollateral] = useState("0");
  const [lendInterest, setLendInterest] = useState("0");
  const [borrowInterest, setBorrowInterest] = useState("0");
  const [action, setAction] = useState<Action>("supply");
  const [amount, setAmount] = useState("");
  const [mintAmt, setMintAmt] = useState("100");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState("");

  const dark = theme === "dark";
  const correctChain = chainId === GIWA_CHAIN_ID;

  const bg = dark ? "#0a0a0f" : "#f4f6fa";
  const surface = dark ? "#12121a" : "#ffffff";
  const border = dark ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.06)";
  const text = dark ? "#e1e4e8" : "#1a1d23";
  const textMuted = dark ? "#6b7080" : "#6b7080";
  const textLight = dark ? "#8b8fa0" : "#8b8fa0";
  const cardBg = dark ? "rgba(22,22,36,0.9)" : "#ffffff";
  const inputBg = dark ? "#0a0a14" : "#f0f2f5";
  const inputBorder = dark ? "#2d2d3a" : "#d0d5e0";

  useEffect(() => {
    localStorage.setItem("gl-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!window.ethereum) return;
    const h = (id: string) => setChainId(Number(id));
    window.ethereum.on("chainChanged", h);
    return () => window.ethereum?.removeListener("chainChanged", h);
  }, []);

  async function addNetwork() {
    try {
      await window.ethereum!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GIWA_NETWORK.chainId }] });
    } catch (e: any) {
      if (e.code === 4902) {
        try { await window.ethereum!.request({ method: "wallet_addEthereumChain", params: [GIWA_NETWORK] }); }
        catch { setStatus("Cancelled"); }
      }
    }
  }

  async function connect() {
    if (!window.ethereum) return setStatus("Install MetaMask");
    try {
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const cid = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(addr); setChainId(Number(cid));
      if (Number(cid) === GIWA_CHAIN_ID) await fetchAll(addr);
    } catch { setStatus("Connection rejected"); }
  }

  async function fetchAll(addr: string) {
    try {
      const [sym, bal, allow] = await Promise.all([
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "balanceOf", args: [addr] }) as Promise<bigint>,
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "allowance", args: [addr, POOL] }) as Promise<bigint>,
      ]);
      setSymbol(sym); setBalance(bal.toString()); setAllowance(allow.toString());
      const [dep, bor] = await Promise.all([
        publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "totalDeposits" }) as Promise<bigint>,
        publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "totalBorrows" }) as Promise<bigint>,
      ]);
      setTDeposits(dep.toString()); setTBorrows(bor.toString());
      setUtil(dep === BigInt(0) ? "0" : Number(bor * BigInt(100) / dep).toString());
      const info = await publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "getUserInfo", args: [addr] }) as bigint[];
      setUDeposits(info[0].toString()); setUBorrows(info[1].toString()); setUCollateral(info[2].toString());
      setLendInterest(info[3].toString()); setBorrowInterest(info[4].toString());
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (account && correctChain) {
      fetchAll(account);
      const i = setInterval(() => fetchAll(account), 10000);
      return () => clearInterval(i);
    }
  }, [account, correctChain]);

  async function tx(fn: () => Promise<void>) {
    if (!correctChain) return setStatus("Wrong network");
    setStatus(""); setLoading("");
    try { await fn(); } catch (e: any) {
      const m = e?.shortMessage || e?.message || "Failed";
      setStatus(m.includes("denied") || m.includes("rejected") ? "Cancelled" : `Error`);
    }
    setLoading("");
    if (account && correctChain) await fetchAll(account);
  }

  async function write(fn: string, args: any[]) {
    const { createWalletClient, custom } = await import("viem");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const addr = fn === "mint" ? TOKEN : POOL;
    const abi = fn === "mint" || fn === "approve" ? tokenAbi : poolAbi;
    const hash = await wallet.writeContract({ address: addr, abi, functionName: fn, args });
    setStatus(`${fn} ✓`);
  }

  const userHealth = () => {
    const d = Number(uDeposits); const b = Number(uBorrows);
    if (d === 0 || b === 0) return { ratio: 100, color: "#10b981", label: "Safe" };
    const ratio = (d * 100) / (b * 1.5);
    const capped = Math.min(ratio, 100);
    return {
      ratio: Math.round(capped),
      color: capped > 80 ? "#10b981" : capped > 50 ? "#f59e0b" : "#ef4444",
      label: capped > 80 ? "Safe" : capped > 50 ? "Moderate" : "Risk",
    };
  };

  const health = userHealth();

  const styles = {
    page: { minHeight: "100vh", background: bg, color: text, fontFamily: "'Inter', -apple-system, sans-serif" },
    nav: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", height: 64,
      borderBottom: `1px solid ${border}`, background: surface,
    },
    navBtn: (active: boolean) => ({
      padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 500,
      cursor: "pointer", transition: "all 0.15s",
      background: active ? (dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)") : "transparent",
      color: active ? "#818cf8" : textMuted,
    }),
    connectBtn: {
      padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
      cursor: "pointer", color: "#fff",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    },
    container: { maxWidth: 800, margin: "0 auto", padding: "32px 24px" },
    summaryRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 },
    summaryCard: (borderColor?: string) => ({
      background: cardBg, borderRadius: 12, padding: "16px 20px", border: `1px solid ${borderColor || border}`,
    }),
    summaryLabel: { fontSize: 12, color: textLight, marginBottom: 4 },
    summaryValue: { fontSize: 20, fontWeight: 700 },
    card: {
      background: cardBg, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden", marginBottom: 24,
    },
    cardHeader: {
      padding: "16px 20px", borderBottom: `1px solid ${border}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    cardBody: { padding: 20 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${border}` },
    label: { fontSize: 13, color: textLight },
    value: { fontSize: 14, fontWeight: 600 },
    healthBar: (pct: number, color: string) => ({
      height: 6, borderRadius: 3, background: dark ? "#1a1a2e" : "#e0e4ec", marginTop: 8, overflow: "hidden" as const,
    }),
    healthFill: (pct: number, color: string) => ({
      height: "100%", borderRadius: 3, width: `${pct}%`, background: color, transition: "width 0.5s ease",
    }),
    actionTabs: {
      display: "flex", gap: 4, marginBottom: 20,
      background: dark ? "rgba(10,10,20,0.6)" : "#f0f2f5",
      padding: 4, borderRadius: 10,
    },
    actionTab: (active: boolean) => ({
      flex: 1, padding: "8px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "all 0.15s",
      background: active ? (dark ? "#1e1e32" : "#fff") : "transparent",
      color: active ? (() => { switch(action) { case "supply": return "#10b981"; case "withdraw": return "#f59e0b"; case "borrow": return "#f59e0b"; case "repay": return "#10b981"; } })() : textMuted,
      boxShadow: active ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)") : "none",
    }),
    input: {
      width: "100%", padding: "12px 16px", borderRadius: 10, fontSize: 16, border: `1px solid ${inputBorder}`,
      background: inputBg, color: text, outline: "none", boxSizing: "border-box" as const,
    },
    actionBtn: (color: string) => ({
      width: "100%", padding: "12px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", background: color, marginTop: 12,
    }),
    inputRow: {
      display: "flex", gap: 12, alignItems: "center", marginBottom: 12,
    },
    mintBtn: {
      padding: "8px 16px", borderRadius: 8, border: `1px solid ${border}`,
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      background: dark ? "#1a1a2e" : "#fff", color: textMuted,
    },
    chip: (bg: string, c: string) => ({
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6,
      fontSize: 11, fontWeight: 500, background: bg, color: c,
    }),
    healthGauge: {
      width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, flexShrink: 0,
    },
  };

  const needsApprove = account && Number(allowance) < Number(toWei(amount || "0"));

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏦</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>GiwaLend</span>
          </div>
          <button style={styles.navBtn(tab === "dashboard")} onClick={() => setTab("dashboard")}>Dashboard</button>
          <button style={styles.navBtn(tab === "market")} onClick={() => setTab("market")}>Market</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {account && (
            <span style={styles.chip(dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", "#818cf8")}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          )}
          <button style={styles.themeBtn as any || {
            width: 36, height: 36, borderRadius: 8, border: `1px solid ${border}`,
            background: "transparent", cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setTheme(dark ? "light" : "dark")}>
            {dark ? "☀️" : "🌙"}
          </button>
          {!account ? (
            <button style={styles.connectBtn} onClick={connect}>Connect Wallet</button>
          ) : !correctChain ? (
            <button style={{ ...styles.connectBtn, background: "linear-gradient(135deg, #f59e0b, #d97706)" }} onClick={addNetwork}>
              Switch Network
            </button>
          ) : null}
        </div>
      </nav>

      <div style={styles.container}>
        {!correctChain && account && (
          <div style={{ ...styles.summaryCard("#f59e0b"), textAlign: "center", marginBottom: 24, background: dark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)" }}>
            <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>
              ⚠️ Wrong Network — Please switch to GIWA Sepolia
            </div>
          </div>
        )}

        {!account && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>GiwaLend</h2>
            <p style={{ color: textLight, marginBottom: 24, fontSize: 14 }}>
              Lend and borrow GLT tokens on GIWA Sepolia
            </p>
            <button style={{ ...styles.connectBtn, padding: "12px 32px", fontSize: 15 }} onClick={connect}>
              Connect Wallet
            </button>
          </div>
        )}

        {account && correctChain && tab === "dashboard" && (
          <>
            <div style={styles.summaryRow}>
              <div style={styles.summaryCard()}>
                <div style={styles.summaryLabel}>Net Worth</div>
                <div style={styles.summaryValue}>{formatter(uDeposits, 2)} {symbol}</div>
                <div style={{ fontSize: 12, color: textLight, marginTop: 2 }}>
                  +{formatter(lendInterest, 4)} earned
                </div>
              </div>
              <div style={styles.summaryCard()}>
                <div style={styles.summaryLabel}>Health Factor</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    ...styles.healthGauge as any,
                    background: `conic-gradient(${health.color} ${health.ratio}%, ${dark ? "#1a1a2e" : "#e0e4ec"} ${health.ratio}%)`,
                    color: health.color,
                  }}>
                    {health.ratio}%
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{health.label}</div>
                    <div style={{ fontSize: 12, color: textLight }}>LTV: 66.67%</div>
                  </div>
                </div>
              </div>
              <div style={styles.summaryCard()}>
                <div style={styles.summaryLabel}>Borrow Balance</div>
                <div style={styles.summaryValue}>{formatter(uBorrows, 2)} {symbol}</div>
                <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 2 }}>
                  -{formatter(borrowInterest, 4)} owing
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Your Supplies</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.row}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🪙</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{symbol}</div>
                      <div style={{ fontSize: 11, color: textLight }}>{formatter(uDeposits, 2)} supplied</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#10b981" }}>{formatter(lendInterest, 4)}</div>
                    <div style={{ fontSize: 11, color: textLight }}>Interest earned</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Your Borrows</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.row}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🪙</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{symbol}</div>
                      <div style={{ fontSize: 11, color: textLight }}>{formatter(uBorrows, 2)} borrowed</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#f59e0b" }}>{formatter(borrowInterest, 4)}</div>
                    <div style={{ fontSize: 11, color: textLight }}>Interest owing</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {account && correctChain && tab === "market" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Market</div>
              <div style={{ fontSize: 13, color: textLight }}>Lend and borrow assets</div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🪙</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{symbol}</div>
                    <div style={{ fontSize: 11, color: textLight }}>{symbol} • GIWA Sepolia</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: textLight }}>Wallet Balance</div>
                  <div style={{ fontWeight: 600 }}>{formatter(balance, 2)} {symbol}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "16px 20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: textLight, marginBottom: 4 }}>Supply APY</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>5%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: textLight, marginBottom: 4 }}>Borrow APR</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>10%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: textLight, marginBottom: 4 }}>Utilization</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{util}%</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 20px 20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: textLight, marginBottom: 4 }}>Total Supplied</div>
                  <div style={{ fontWeight: 600 }}>{formatter(tDeposits, 2)} {symbol}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: textLight, marginBottom: 4 }}>Total Borrowed</div>
                  <div style={{ fontWeight: 600 }}>{formatter(tBorrows, 2)} {symbol}</div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Actions</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={mintAmt} onChange={e => setMintAmt(e.target.value)}
                    style={{ ...styles.input as any, width: 80, padding: "6px 8px", fontSize: 12, textAlign: "center" }} />
                  <button style={styles.mintBtn} onClick={() => tx(() => write("mint", [toWei(mintAmt)]))}>
                    Mint {symbol}
                  </button>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.actionTabs}>
                  <button style={styles.actionTab(action === "supply")} onClick={() => { setAction("supply"); setAmount(""); }}>Supply</button>
                  <button style={styles.actionTab(action === "withdraw")} onClick={() => { setAction("withdraw"); setAmount(""); }}>Withdraw</button>
                  <button style={styles.actionTab(action === "borrow")} onClick={() => { setAction("borrow"); setAmount(""); }}>Borrow</button>
                  <button style={styles.actionTab(action === "repay")} onClick={() => { setAction("repay"); setAmount(""); }}>Repay</button>
                </div>

                <div style={{ fontSize: 13, color: textLight, marginBottom: 8 }}>
                  {action === "supply" && `Supply ${symbol} to earn 5% APY`}
                  {action === "withdraw" && `Withdraw ${symbol} (Supplied: ${formatter(uDeposits, 2)})`}
                  {action === "borrow" && `Borrow ${symbol} at 10% APR (Collateral: ${formatter(uCollateral, 2)})`}
                  {action === "repay" && `Repay ${symbol} (Borrowed: ${formatter(uBorrows, 2)})`}
                </div>

                <div style={styles.inputRow}>
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00" style={styles.input} />
                  <button style={{
                    padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`,
                    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    background: inputBg, color: textMuted,
                  }} onClick={() => {
                    const max = action === "supply" ? balance : action === "withdraw" ? uDeposits : action === "borrow" ? uCollateral : uBorrows;
                    setAmount(formatter(max, 6));
                  }}>
                    MAX
                  </button>
                </div>

                {loading && <div style={{ textAlign: "center", color: "#f59e0b", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>⏳ {loading}...</div>}
                {status && <div style={{
                  textAlign: "center", padding: "6px 0", borderRadius: 8, fontSize: 12, marginBottom: 8,
                  color: status.startsWith("Error") ? "#ef4444" : "#10b981",
                  background: status.startsWith("Error") ? (dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)") : (dark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.06)"),
                }}>{status}</div>}

                {action === "supply" && needsApprove && (
                  <button style={styles.actionBtn("#f59e0b")} onClick={() => tx(() => write("approve", []))}>
                    Approve Pool to spend {symbol}
                  </button>
                )}
                {action === "supply" && !needsApprove && (
                  <button style={styles.actionBtn("linear-gradient(135deg, #10b981, #059669)")}
                    onClick={() => tx(() => write("deposit", [toWei(amount)]))} disabled={!!loading}>
                    Supply {symbol}
                  </button>
                )}
                {action === "withdraw" && (
                  <button style={styles.actionBtn("linear-gradient(135deg, #f59e0b, #d97706)")}
                    onClick={() => tx(() => write("withdraw", [toWei(amount)]))} disabled={!!loading}>
                    Withdraw {symbol}
                  </button>
                )}
                {action === "borrow" && (
                  <button style={styles.actionBtn("linear-gradient(135deg, #f59e0b, #d97706)")}
                    onClick={() => tx(() => write("borrow", [toWei(amount)]))} disabled={!!loading}>
                    Borrow {symbol}
                  </button>
                )}
                {action === "repay" && (
                  <button style={styles.actionBtn("linear-gradient(135deg, #10b981, #059669)")}
                    onClick={() => tx(() => write("repay", [toWei(amount)]))} disabled={!!loading}>
                    Repay {symbol}
                  </button>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Your Position</span>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.row}>
                  <span style={styles.label}>Supplied</span>
                  <span style={styles.value}>{formatter(uDeposits, 4)} {symbol}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>Borrowed</span>
                  <span style={styles.value}>{formatter(uBorrows, 4)} {symbol}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>Collateral</span>
                  <span style={styles.value}>{formatter(uCollateral, 4)} {symbol}</span>
                </div>
                <div style={styles.row}>
                  <span style={styles.label}>Health Factor</span>
                  <div style={{ flex: 1, marginLeft: 16 }}>
                    <div style={styles.healthBar(health.ratio, health.color)}>
                      <div style={styles.healthFill(health.ratio, health.color)} />
                    </div>
                    <div style={{ fontSize: 11, color: health.color, textAlign: "right", marginTop: 2 }}>{health.label}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
