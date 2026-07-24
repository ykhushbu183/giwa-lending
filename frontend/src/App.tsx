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

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("gl-theme") || "dark");
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(0);
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
  const onCorrectChain = chainId === GIWA_CHAIN_ID;

  useEffect(() => {
    localStorage.setItem("gl-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (id: string) => setChainId(Number(id));
    window.ethereum.on("chainChanged", handler);
    return () => { window.ethereum?.removeListener("chainChanged", handler); };
  }, []);

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

  async function addGiwaNetwork() {
    try {
      await window.ethereum!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GIWA_NETWORK.chainId }] });
    } catch (e: any) {
      if (e.code === 4902) {
        try {
          await window.ethereum!.request({ method: "wallet_addEthereumChain", params: [GIWA_NETWORK] });
        } catch {
          setStatus("Network add cancelled");
        }
      }
    }
  }

  async function connectWallet() {
    if (!window.ethereum) return setStatus("Install MetaMask");
    try {
      const [addr] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const cid = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(addr);
      setChainId(Number(cid));
      if (Number(cid) === GIWA_CHAIN_ID) await fetchData(addr);
    } catch { setStatus("Connection rejected"); }
  }

  async function disconnect() {
    setAccount("");
    setChainId(0);
    setTokenBalance("0");
    setPoolAllowance("0");
    setStatus("");
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
      setUtilization(dep === BigInt(0) ? "0" : Number(bor * BigInt(100) / dep).toString());
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
    if (account && onCorrectChain) {
      fetchData(account);
      const interval = setInterval(() => fetchData(account), 10000);
      return () => clearInterval(interval);
    }
  }, [account, onCorrectChain]);

  async function sendTx(fn: () => Promise<void>) {
    if (!onCorrectChain) return setStatus("Switch to GIWA Sepolia first");
    setStatus(""); setLoading("");
    try { await fn(); } catch (e: any) {
      const msg = e?.shortMessage || e?.message || "Transaction failed";
      if (msg.includes("User rejected") || msg.includes("denied")) setStatus("Cancelled");
      else setStatus(`Error: ${msg.slice(0, 60)}`);
    }
    setLoading("");
    if (account && onCorrectChain) await fetchData(account);
  }

  async function writeContract(abi: any[], fn: string, args: any[]) {
    const { createWalletClient, custom } = await import("viem");
    const wallet = createWalletClient({ account: account as any, chain: giwaSepolia, transport: custom(window.ethereum!) });
    const addr = fn === "mint" ? TOKEN : POOL;
    const hash = await wallet.writeContract({ address: addr, abi, functionName: fn, args });
    setStatus(`${fn} successful! Tx: ${hash.slice(0, 10)}...`);
  }

  const doMint = () => writeContract(tokenAbi, "mint", [parseEther(mintAmount)]);
  const doApprove = () => writeContract(tokenAbi, "approve", [POOL, BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")]);
  const doDeposit = () => writeContract(poolAbi, "deposit", [parseEther(depositAmount)]);
  const doWithdraw = () => writeContract(poolAbi, "withdraw", [parseEther(withdrawAmount)]);
  const doBorrow = () => writeContract(poolAbi, "borrow", [parseEther(borrowAmount)]);
  const doRepay = () => writeContract(poolAbi, "repay", [parseEther(repayAmount)]);

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
    layout: {
      display: "flex", maxWidth: 900, margin: "0 auto", minHeight: "100vh", position: "relative" as const,
    },
    main: {
      flex: 1, padding: "24px 20px", minWidth: 0,
    },
    sidebar: {
      width: 280, padding: "24px 16px", flexShrink: 0,
      borderLeft: isDark ? "1px solid rgba(99,102,241,0.1)" : "1px solid rgba(0,0,0,0.06)",
      background: isDark ? "rgba(16,16,30,0.6)" : "rgba(255,255,255,0.5)",
      backdropFilter: "blur(12px)",
      display: account ? "block" : "none",
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 20, marginBottom: 24,
      borderBottom: isDark ? "1px solid rgba(99,102,241,0.1)" : "1px solid rgba(0,0,0,0.06)",
    },
    logo: {
      fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px",
      background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    } as any,
    themeBtn: {
      width: 40, height: 40, borderRadius: 12, border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      background: isDark ? "#1a1a2e" : "#fff", cursor: "pointer", fontSize: 18,
      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
    },
    card: {
      background: isDark ? "rgba(26, 26, 46, 0.8)" : "rgba(255,255,255,0.9)",
      backdropFilter: "blur(20px)", borderRadius: 16,
      border: isDark ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(0,0,0,0.06)",
      padding: 20, marginBottom: 16,
      boxShadow: isDark ? "0 4px 30px rgba(0,0,0,0.3)" : "0 2px 20px rgba(0,0,0,0.04)",
    },
    sideCard: {
      background: isDark ? "rgba(26, 26, 46, 0.6)" : "rgba(255,255,255,0.8)",
      borderRadius: 16, padding: 20, marginBottom: 16,
      border: isDark ? "1px solid rgba(99,102,241,0.1)" : "1px solid rgba(0,0,0,0.06)",
    },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
    statBox: {
      padding: "14px 8px", textAlign: "center" as const, borderRadius: 12,
      background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)",
    },
    statVal: {
      fontSize: 20, fontWeight: 700, margin: "4px 0 0",
      background: "linear-gradient(135deg, #6366f1, #a855f7)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    } as any,
    statLabel: { fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
    input: {
      width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, boxSizing: "border-box" as const,
      background: isDark ? "#0d0d1a" : "#f4f6fa",
      border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      color: isDark ? "#e1e4e8" : "#1a1d23", outline: "none",
    },
    btnPrimary: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff",
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    },
    btnSecondary: {
      padding: "10px 20px", borderRadius: 10, border: isDark ? "1px solid #2d2d3a" : "1px solid #d0d5e0",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      background: isDark ? "#1a1a2e" : "#fff", color: isDark ? "#c9cdd4" : "#4a4d5c",
    },
    btnSuccess: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, #10b981, #059669)",
    },
    btnWarning: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 600,
      cursor: "pointer", color: "#fff", background: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    btnDanger: {
      padding: "10px 20px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 600,
      cursor: "pointer", color: "#ef4444",
      background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
    },
    btnOutline: {
      width: "100%", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      border: "1px solid #818cf8", cursor: "pointer", color: "#818cf8",
      background: "transparent", textAlign: "center" as const,
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
    networkDot: {
      width: 8, height: 8, borderRadius: "50%", display: "inline-block", marginRight: 6,
    },
  };

  const needsApproval = account && Number(poolAllowance) < Number(parseEther(depositAmount || "0"));

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={s.main}>
          <div style={s.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🏦</span>
              <span style={s.logo}>GiwaLend</span>
              <span style={s.badge}>Beta</span>
            </div>
            <button style={s.themeBtn} onClick={toggleTheme}>
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>

          {!onCorrectChain && account && (
            <div style={{
              ...s.card, border: "1px solid #f59e0b",
              background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#f59e0b" }}>Wrong Network</div>
              <div style={{ fontSize: 13, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12 }}>
                Please switch to <strong>GIWA Sepolia</strong>
              </div>
              <button onClick={addGiwaNetwork} style={s.btnOutline}>
                Add / Switch to GIWA Sepolia
              </button>
            </div>
          )}

          <div style={s.card}>
            {!account ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 20, fontSize: 14 }}>
                  Connect your wallet to start lending & borrowing on GIWA
                </p>
                <button onClick={connectWallet} style={{ ...s.btnPrimary, padding: "14px 32px", fontSize: 15 }}>
                  Connect Wallet
                </button>
              </div>
            ) : onCorrectChain ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#8b8fa0", marginBottom: 4 }}>WALLET</div>
                    <code style={{ fontSize: 13, color: "#818cf8" }}>
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </code>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#8b8fa0", marginBottom: 4 }}>BALANCE</div>
                    <div style={{ fontWeight: 600 }}>{formatEther(tokenBalance, 2)} {tokenSymbol}</div>
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
                  <div style={{ textAlign: "center", padding: "10px 0", color: "#f59e0b", fontWeight: 600, fontSize: 13 }}>
                    ⏳ {loading}...
                  </div>
                )}
                {status && (
                  <div style={{
                    textAlign: "center", padding: "8px 12px", marginBottom: 12, borderRadius: 8, fontSize: 13,
                    background: status.startsWith("Error") ? (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)") : (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)"),
                    color: status.startsWith("Error") ? "#ef4444" : "#10b981",
                  }}>
                    {status}
                  </div>
                )}

                <div style={s.sectionTitle}>Tokens</div>
                <div style={{ ...s.flex, marginBottom: 16 }}>
                  <input value={mintAmount} onChange={e => setMintAmount(e.target.value)}
                    style={{ ...s.input, width: 120 }} placeholder="Amount" />
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
            ) : null}

            {!onCorrectChain && account && (
              <div style={{ textAlign: "center", padding: 20, color: isDark ? "#8b8fa0" : "#6b6f80", fontSize: 13 }}>
                Go to the network banner above and click "Add / Switch to GIWA Sepolia"
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", fontSize: 11, color: isDark ? "#4a4d5c" : "#9ca0b0", padding: "16px 0" }}>
            GiwaLend — GIWA Sepolia Testnet
          </div>
        </div>

        <div style={s.sidebar}>
          <div style={s.sideCard}>
            <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Wallet
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 12px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, color: "#fff", fontWeight: 700,
            }}>
              {account ? account.slice(2, 4).toUpperCase() : "?"}
            </div>
            <div style={{ textAlign: "center", wordBreak: "break-all", fontSize: 12, color: "#818cf8", fontFamily: "monospace", marginBottom: 8 }}>
              {account || "Not connected"}
            </div>
          </div>

          <div style={s.sideCard}>
            <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Network
            </div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <span style={{ ...s.networkDot, background: onCorrectChain ? "#10b981" : "#ef4444" }} />
              <span style={{ fontSize: 13 }}>{onCorrectChain ? "GIWA Sepolia" : "Wrong Network"}</span>
            </div>
            <button onClick={addGiwaNetwork} style={s.btnOutline}>
              + Add GIWA Network
            </button>
          </div>

          <div style={s.sideCard}>
            <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Stats
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: isDark ? "#8b8fa0" : "#6b6f80" }}>Balance</span>
              <span style={{ fontWeight: 600 }}>{formatEther(tokenBalance, 2)} {tokenSymbol}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: isDark ? "#8b8fa0" : "#6b6f80" }}>Deposited</span>
              <span style={{ fontWeight: 600 }}>{formatEther(userDeposits, 2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: isDark ? "#8b8fa0" : "#6b6f80" }}>Borrowed</span>
              <span style={{ fontWeight: 600 }}>{formatEther(userBorrows, 2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: isDark ? "#8b8fa0" : "#6b6f80" }}>Allowance</span>
              <span style={{ fontWeight: 600, color: Number(poolAllowance) > 0 ? "#10b981" : "#ef4444" }}>
                {Number(poolAllowance) > 0 ? "Approved" : "Not Set"}
              </span>
            </div>
          </div>

          <div style={{ ...s.sideCard, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: isDark ? "#8b8fa0" : "#6b6f80", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              About
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: isDark ? "#8b8fa0" : "#6b6f80" }}>
              Lend and borrow {tokenSymbol} tokens on GIWA Sepolia.
              Earn <strong style={{ color: "#10b981" }}>5% APY</strong> on deposits,
              pay <strong style={{ color: "#f59e0b" }}>10% APR</strong> on borrows.
              Requires 150% collateral ratio.
            </div>
          </div>

          <button onClick={disconnect} style={{ ...s.btnDanger, width: "100%", padding: "12px", fontSize: 13, fontWeight: 600 }}>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
