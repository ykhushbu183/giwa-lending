import { useState, useEffect } from "react";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { giwaSepolia } from "viem/chains";

const TOKEN = "0xCcB10752990A7508933d2fF509e011f71032073F";
const POOL = "0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA";

const tokenAbi = [
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "name", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
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

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("gl-theme");
    return saved || "dark";
  });

  const [account, setAccount] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("GLT");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [poolAllowance, setPoolAllowance] = useState("0");

  const [totalDeposits, setTotalDeposits] = useState("0");
  const [totalBorrows, setTotalBorrows] = useState("0");
  const [utilization, setUtilization] = useState("0");

  const [userDeposits, setUserDeposits] = useState("0");
  const [userBorrows, setUserBorrows] = useState("0");
  const [userCollateral, setUserCollateral] = useState("0");
  const [lendInterest, setLendInterest] = useState("0");
  const [borrowInterest, setBorrowInterest] = useState("0");

  const [mintAmount, setMintAmount] = useState("100");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState("");

  const isDark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("gl-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const formatEther = (wei: string, decimals = 4) => {
    const val = Number(wei) / 1e18;
    if (val === 0) return "0";
    if (val < 0.0001) return "<0.0001";
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
  };

  const parseEther = (val: string) => {
    const cleaned = val.replace(/,/g, "");
    if (!cleaned || isNaN(Number(cleaned))) return BigInt(0);
    return BigInt(Math.floor(Number(cleaned) * 1e18));
  };

  async function connectWallet() {
    if (!window.ethereum) return setStatus("Install MetaMask");
    try {
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(addr);
      await fetchData(addr);
    } catch { setStatus("Connection rejected"); }
  }

  async function fetchData(addr: string) {
    try {
      const [sym, bal, allow] = await Promise.all([
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "symbol" }) as Promise<string>,
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "balanceOf", args: [addr] }) as Promise<bigint>,
        publicClient.readContract({ address: TOKEN, abi: tokenAbi, functionName: "allowance", args: [addr, POOL] }) as Promise<bigint>,
      ]);
      setTokenSymbol(sym);
      setTokenBalance(bal.toString());
      setPoolAllowance(allow.toString());

      const [dep, bor] = await Promise.all([
        publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "totalDeposits" }) as Promise<bigint>,
        publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "totalBorrows" }) as Promise<bigint>,
      ]);
      setTotalDeposits(dep.toString());
      setTotalBorrows(bor.toString());
      const depNum = dep;
      const borNum = bor;
      setUtilization(depNum === BigInt(0) ? "0" : Number(borNum * BigInt(100) / depNum).toString());

      if (addr) {
        const info = await publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "getUserInfo", args: [addr] }) as bigint[];
        setUserDeposits(info[0].toString());
        setUserBorrows(info[1].toString());
        setUserCollateral(info[2].toString());
        setLendInterest(info[3].toString());
        setBorrowInterest(info[4].toString());
      }
    } catch (e) { console.error("fetch", e); }
  }

  useEffect(() => {
    if (account) {
      fetchData(account);
      const interval = setInterval(() => fetchData(account), 10000);
      return () => clearInterval(interval);
    }
  }, [account]);

  async function sendTx(fn: () => Promise<void>) {
    setStatus(""); setLoading("");
    try { await fn(); } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Transaction failed";
      if (msg.includes("User rejected")) setStatus("Cancelled");
      else setStatus(`Error: ${msg.slice(0, 60)}`);
    }
    setLoading("");
    if (account) await fetchData(account);
  }

  async function doMint() {
    const amt = parseEther(mintAmount);
    if (amt === BigInt(0)) return setStatus("Enter amount");
    setLoading("Minting");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: TOKEN, abi: tokenAbi, functionName: "mint", args: [amt] });
    setStatus(`Minted! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  async function doApprove() {
    const amt = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
    setLoading("Approving");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: TOKEN, abi: tokenAbi, functionName: "approve", args: [POOL, amt] });
    setStatus(`Approved! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  async function doDeposit() {
    const amt = parseEther(depositAmount);
    if (amt === BigInt(0)) return setStatus("Enter amount");
    setLoading("Depositing");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: POOL, abi: poolAbi, functionName: "deposit", args: [amt] });
    setStatus(`Deposited! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  async function doWithdraw() {
    const amt = parseEther(withdrawAmount);
    if (amt === BigInt(0)) return setStatus("Enter amount");
    setLoading("Withdrawing");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: POOL, abi: poolAbi, functionName: "withdraw", args: [amt] });
    setStatus(`Withdrawn! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  async function doBorrow() {
    const amt = parseEther(borrowAmount);
    if (amt === BigInt(0)) return setStatus("Enter amount");
    setLoading("Borrowing");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: POOL, abi: poolAbi, functionName: "borrow", args: [amt] });
    setStatus(`Borrowed! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  async function doRepay() {
    const amt = parseEther(repayAmount);
    if (amt === BigInt(0)) return setStatus("Enter amount");
    setLoading("Repaying");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const hash = await wallet.writeContract({ address: POOL, abi: poolAbi, functionName: "repay", args: [amt] });
    setStatus(`Repaid! Tx: ${hash.slice(0, 10)}...`);
    setLoading("");
  }

  const s = {
    page: {
      minHeight: "100vh",
      background: isDark
        ? "linear-gradient(135deg, #0a0a0f 0%, #12121a 30%, #1a1a2e 70%, #0f0f1a 100%)"
        : "linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 50%, #dfe6f0 100%)",
      color: isDark ? "#e1e4e8" : "#1a1d23",
      fontFamily: "'Inter', -apple-system, sans-serif",
      transition: "all 0.3s ease",
    },
    container: {
      maxWidth: 520, margin: "0 auto", padding: "24px 16px",
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 0", marginBottom: 24,
    },
    logo: {
      fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
      background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    } as any,
    themeBtn: {
      width: 40, height: 40, borderRadius: 12, border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      background: isDark ? "#1a1a2e" : "#fff",
      cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
    },
    card: {
      background: isDark ? "rgba(26, 26, 46, 0.8)" : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(20px)",
      borderRadius: 16,
      border: isDark ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(0,0,0,0.06)",
      padding: 20, marginBottom: 16,
      boxShadow: isDark ? "0 4px 30px rgba(0,0,0,0.3)" : "0 2px 20px rgba(0,0,0,0.04)",
    },
    grid3: {
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16,
    },
    statBox: {
      padding: "14px 8px", textAlign: "center" as const, borderRadius: 12,
      background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)",
    },
    statVal: {
      fontSize: 20, fontWeight: 700, margin: "4px 0 0",
      background: "linear-gradient(135deg, #6366f1, #a855f7)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    } as any,
    statLabel: { fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14,
      background: isDark ? "#0d0d1a" : "#f4f6fa",
      border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      color: isDark ? "#e1e4e8" : "#1a1d23",
      outline: "none", boxSizing: "border-box" as const,
      transition: "border 0.2s",
    },
    btnPrimary: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", transition: "all 0.2s",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    },
    btnSecondary: {
      padding: "10px 20px", borderRadius: 10, border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
      background: isDark ? "#1a1a2e" : "#fff",
      color: isDark ? "#c9cdd4" : "#4a4d5c",
    },
    btnSuccess: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", transition: "all 0.2s",
      background: "linear-gradient(135deg, #10b981, #059669)",
    },
    btnWarning: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", transition: "all 0.2s",
      background: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    flex: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const },
    sectionTitle: {
      fontSize: 13, fontWeight: 600, textTransform: "uppercase" as const,
      letterSpacing: "0.8px", color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12,
    },
    badge: {
      display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500,
      background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
      color: "#818cf8", marginLeft: 8,
    },
  };

  const needsApproval = account && Number(poolAllowance) < Number(parseEther(depositAmount || "0"));

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🏦</span>
            <span style={s.logo}>GiwaLend</span>
            <span style={s.badge}>Beta</span>
          </div>
          <button style={s.themeBtn} onClick={toggleTheme} title="Toggle theme">
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        <div style={s.card}>
          {!account ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 16, fontSize: 14 }}>
                Connect your wallet to start lending & borrowing on GIWA
              </p>
              <button onClick={connectWallet} style={{
                ...s.btnPrimary, padding: "14px 32px", fontSize: 15,
              }}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 4 }}>WALLET</div>
                  <code style={{ fontSize: 13, color: "#818cf8" }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </code>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 4 }}>BALANCE</div>
                  <div style={{ fontWeight: 600 }}>
                    {formatEther(tokenBalance, 2)} {tokenSymbol}
                  </div>
                </div>
              </div>

              <div style={s.grid3}>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Deposits</div>
                  <div style={s.statVal}>{formatEther(totalDeposits)}</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Borrows</div>
                  <div style={s.statVal}>{formatEther(totalBorrows)}</div>
                </div>
                <div style={s.statBox}>
                  <div style={s.statLabel}>Utilization</div>
                  <div style={s.statVal}>{utilization}%</div>
                </div>
              </div>

              {loading && (
                <div style={{
                  textAlign: "center", padding: "10px 0",
                  color: "#f59e0b", fontWeight: 600, fontSize: 13,
                }}>
                  ⏳ {loading}...
                </div>
              )}
              {status && (
                <div style={{
                  textAlign: "center", padding: "8px 12px", marginBottom: 12, borderRadius: 8, fontSize: 13,
                  background: status.startsWith("Error")
                    ? (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)")
                    : (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)"),
                  color: status.startsWith("Error") ? "#ef4444" : "#10b981",
                }}>
                  {status}
                </div>
              )}

              <div style={{ ...s.sectionTitle, marginTop: 8 }}>Tokens</div>
              <div style={{ ...s.flex, marginBottom: 16 }}>
                <input
                  value={mintAmount}
                  onChange={e => setMintAmount(e.target.value)}
                  style={{ ...s.input, width: 120 }}
                  placeholder="Amount"
                />
                <button style={s.btnPrimary} onClick={() => sendTx(doMint)} disabled={!!loading}>
                  Mint {tokenSymbol}
                </button>
                <button style={s.btnSecondary} onClick={() => sendTx(doApprove)} disabled={!!loading}>
                  Approve Pool
                </button>
                {Number(poolAllowance) > 0 && (
                  <span style={{ fontSize: 11, color: "#10b981" }}>✅ Approved</span>
                )}
              </div>

              <div style={s.sectionTitle}>Your Position</div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                padding: 12, borderRadius: 10,
                background: isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)",
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8b8fa0" }}>Deposited</div>
                  <div style={{ fontWeight: 600 }}>{formatEther(userDeposits, 4)} <span style={{ color: "#10b981" }}>+{formatEther(lendInterest, 4)}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#8b8fa0" }}>Borrowed</div>
                  <div style={{ fontWeight: 600 }}>{formatEther(userBorrows, 4)} <span style={{ color: "#ef4444" }}>-{formatEther(borrowInterest, 4)}</span></div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, color: "#8b8fa0" }}>Collateral</div>
                  <div style={{ fontWeight: 600 }}>{formatEther(userCollateral, 4)} {tokenSymbol}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={s.card}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#10b981" }}>Lend ▸</h4>
                  <input value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Amount" style={{ ...s.input, marginBottom: 8 }} />
                  <div style={s.flex}>
                    {needsApproval ? (
                      <button style={s.btnWarning} onClick={() => sendTx(doApprove)} disabled={!!loading}>
                        Approve First
                      </button>
                    ) : (
                      <button style={s.btnSuccess} onClick={() => sendTx(doDeposit)} disabled={!!loading}>
                        Deposit
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: isDark ? "1px solid #2d2d3a" : "1px solid #e0e4ec" }}>
                    <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="Amount" style={{ ...s.input, marginBottom: 8 }} />
                    <button style={s.btnSecondary} onClick={() => sendTx(doWithdraw)} disabled={!!loading}>
                      Withdraw
                    </button>
                  </div>
                </div>

                <div style={s.card}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#f59e0b" }}>Borrow ▸</h4>
                  <input value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)}
                    placeholder="Amount" style={{ ...s.input, marginBottom: 8 }} />
                  <button style={s.btnWarning} onClick={() => sendTx(doBorrow)} disabled={!!loading}>
                    Borrow
                  </button>
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: isDark ? "1px solid #2d2d3a" : "1px solid #e0e4ec" }}>
                    <input value={repayAmount} onChange={e => setRepayAmount(e.target.value)}
                      placeholder="Amount" style={{ ...s.input, marginBottom: 8 }} />
                    <button style={s.btnSecondary} onClick={() => sendTx(doRepay)} disabled={!!loading}>
                      Repay
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: isDark ? "#4a4d5c" : "#9ca0b0", padding: "16px 0" }}>
          GiwaLend — GIWA Sepolia Testnet
        </div>
      </div>
    </div>
  );
}

export default App;
