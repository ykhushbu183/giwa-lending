import { useState, useEffect } from "react";
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { giwaSepolia } from "viem/chains";

const DOJANG_SCROLL = "0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9";
const LENDING_POOL = "0xYOUR_CONTRACT_ADDRESS_HERE";
const VERIFIED_TOKEN = "0xBCdB22f56642DE57624CfC2fBb9eE398cF3CA268";
const ATTESTER_ID = "0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034";

const dojangAbi = [
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "bytes32", name: "", type: "bytes32" },
    ],
    name: "isVerified",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const poolAbi = [
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getPoolStats",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserInfo",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalBorrows",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const tokenAbi = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const publicClient = createPublicClient({
  chain: giwaSepolia,
  transport: http(),
});

function App() {
  const [account, setAccount] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [totalDeposits, setTotalDeposits] = useState("0");
  const [totalBorrows, setTotalBorrows] = useState("0");
  const [utilization, setUtilization] = useState("0");
  const [userDeposits, setUserDeposits] = useState("0");
  const [userBorrows, setUserBorrows] = useState("0");
  const [userCollateral, setUserCollateral] = useState("0");
  const [lendInterest, setLendInterest] = useState("0");
  const [borrowInterest, setBorrowInterest] = useState("0");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return alert("Install MetaMask");
    try {
      const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(address);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (account) {
      checkKYC();
      fetchPoolStats();
      fetchUserInfo();
    }
  }, [account]);

  async function checkKYC() {
    try {
      const data = await publicClient.readContract({
        address: DOJANG_SCROLL,
        abi: dojangAbi,
        functionName: "isVerified",
        args: [account, ATTESTER_ID],
      });
      setIsVerified(data);
    } catch (e) {
      console.error("KYC check failed:", e);
    }
  }

  async function fetchPoolStats() {
    try {
      const [dep, bor] = await Promise.all([
        publicClient.readContract({ address: LENDING_POOL, abi: poolAbi, functionName: "totalDeposits" }),
        publicClient.readContract({ address: LENDING_POOL, abi: poolAbi, functionName: "totalBorrows" }),
      ]);
      const d = Number(dep);
      const b = Number(bor);
      setTotalDeposits(d.toString());
      setTotalBorrows(b.toString());
      setUtilization(d === 0 ? "0" : ((b * 100) / d).toFixed(1));
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchUserInfo() {
    try {
      const data = await publicClient.readContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: "getUserInfo",
        args: [account],
      });
      setUserDeposits(Number(data[0]).toString());
      setUserBorrows(Number(data[1]).toString());
      setUserCollateral(Number(data[2]).toString());
      setLendInterest(Number(data[3]).toFixed(4));
      setBorrowInterest(Number(data[4]).toFixed(4));
    } catch (e) {
      console.error(e);
    }
  }

  async function deposit() {
    if (!window.ethereum || !depositAmount) return;
    setLoading("Approving...");
    const walletClient = createWalletClient({ chain: giwaSepolia, transport: custom(window.ethereum) });
    try {
      const amount = BigInt(depositAmount) * BigInt(10 ** 18);
      const hash = await walletClient.writeContract({
        address: VERIFIED_TOKEN,
        abi: tokenAbi,
        functionName: "approve",
        args: [LENDING_POOL, amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setLoading("Depositing...");
      const hash2 = await walletClient.writeContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: "deposit",
        args: [amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });
      setStatus("Deposit successful!");
      await fetchPoolStats();
      await fetchUserInfo();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setLoading("");
  }

  async function withdraw() {
    if (!window.ethereum || !withdrawAmount) return;
    setLoading("Withdrawing...");
    const walletClient = createWalletClient({ chain: giwaSepolia, transport: custom(window.ethereum) });
    try {
      const amount = BigInt(withdrawAmount) * BigInt(10 ** 18);
      const hash = await walletClient.writeContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: "withdraw",
        args: [amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("Withdrawal successful!");
      await fetchPoolStats();
      await fetchUserInfo();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setLoading("");
  }

  async function borrow() {
    if (!window.ethereum || !borrowAmount) return;
    setLoading("Borrowing...");
    const walletClient = createWalletClient({ chain: giwaSepolia, transport: custom(window.ethereum) });
    try {
      const amount = BigInt(borrowAmount) * BigInt(10 ** 18);
      const hash = await walletClient.writeContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: "borrow",
        args: [amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus("Borrow successful!");
      await fetchPoolStats();
      await fetchUserInfo();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setLoading("");
  }

  async function repay() {
    if (!window.ethereum || !repayAmount) return;
    setLoading("Approving...");
    const walletClient = createWalletClient({ chain: giwaSepolia, transport: custom(window.ethereum) });
    try {
      const amount = BigInt(repayAmount) * BigInt(10 ** 18);
      const hash = await walletClient.writeContract({
        address: VERIFIED_TOKEN,
        abi: tokenAbi,
        functionName: "approve",
        args: [LENDING_POOL, amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setLoading("Repaying...");
      const hash2 = await walletClient.writeContract({
        address: LENDING_POOL,
        abi: poolAbi,
        functionName: "repay",
        args: [amount],
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: hash2 });
      setStatus("Repayment successful!");
      await fetchPoolStats();
      await fetchUserInfo();
    } catch (e) {
      setStatus("Error: " + e.message);
    }
    setLoading("");
  }

  return (
    <div style={{
      maxWidth: 700, margin: "auto", padding: "2rem", fontFamily: "Inter, sans-serif",
      background: "#0d1117", color: "#c9d1d9", minHeight: "100vh"
    }}>
      <h1 style={{ color: "#58a6ff", fontSize: "2rem" }}>🏦 GiwaLend</h1>
      <p style={{ color: "#8b949e" }}>KYC-Gated Lending Protocol on GIWA Chain</p>

      {!account ? (
        <button onClick={connectWallet} style={{
          padding: "12px 24px", fontSize: "16px", background: "#238636", color: "#fff",
          border: "none", borderRadius: 6, cursor: "pointer", marginTop: 20
        }}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{
            padding: 12, background: "#161b22", borderRadius: 8, border: "1px solid #30363d", marginBottom: 16
          }}>
            <p>Wallet: <code>{account.slice(0, 6)}...{account.slice(-4)}</code></p>
            <p>KYC: {isVerified ?
              <span style={{ color: "#3fb950" }}>✅ Verified</span> :
              <span style={{ color: "#f85149" }}>❌ Not Verified</span>}
            </p>
          </div>

          {loading && <div style={{ color: "#d29922", marginBottom: 12, fontWeight: "bold" }}>{loading}...</div>}
          {status && <div style={{ color: status.startsWith("Error") ? "#f85149" : "#3fb950", marginBottom: 12 }}>{status}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d", textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#8b949e" }}>Total Deposits</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#58a6ff", margin: "8px 0" }}>{totalDeposits}</p>
            </div>
            <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d", textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#8b949e" }}>Total Borrows</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#f0883e", margin: "8px 0" }}>{totalBorrows}</p>
            </div>
            <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d", textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: 14, color: "#8b949e" }}>Utilization</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#d2a8ff", margin: "8px 0" }}>{utilization}%</p>
            </div>
          </div>

          {isVerified && (
            <>
              <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d", marginBottom: 16 }}>
                <h3>Your Position</h3>
                <p>Deposits: <strong>{userDeposits}</strong> | Interest Earned: <strong style={{ color: "#3fb950" }}>+{lendInterest}</strong></p>
                <p>Borrows: <strong>{userBorrows}</strong> | Interest Owing: <strong style={{ color: "#f85149" }}>-{borrowInterest}</strong></p>
                <p>Collateral: <strong>{userCollateral}</strong></p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d" }}>
                  <h3 style={{ color: "#3fb950" }}>Lend</h3>
                  <input value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                    placeholder="Amount in VT"
                    style={{ width: "90%", padding: 8, marginBottom: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#fff" }} />
                  <button onClick={deposit} style={{ padding: "8px 16px", background: "#238636", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginRight: 8 }}>Deposit</button>
                  <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Amount"
                    style={{ width: "90%", padding: 8, margin: "8px 0", background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#fff" }} />
                  <button onClick={withdraw} style={{ padding: "8px 16px", background: "#21262d", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, cursor: "pointer" }}>Withdraw</button>
                </div>

                <div style={{ padding: 16, background: "#161b22", borderRadius: 8, border: "1px solid #30363d" }}>
                  <h3 style={{ color: "#f0883e" }}>Borrow</h3>
                  <input value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)}
                    placeholder="Amount"
                    style={{ width: "90%", padding: 8, marginBottom: 8, background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#fff" }} />
                  <button onClick={borrow} style={{ padding: "8px 16px", background: "#d29922", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", marginRight: 8 }}>Borrow</button>
                  <input value={repayAmount} onChange={e => setRepayAmount(e.target.value)}
                    placeholder="Amount"
                    style={{ width: "90%", padding: 8, margin: "8px 0", background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, color: "#fff" }} />
                  <button onClick={repay} style={{ padding: "8px 16px", background: "#21262d", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: 4, cursor: "pointer" }}>Repay</button>
                </div>
              </div>
            </>
          )}

          {!isVerified && (
            <div style={{ padding: 20, background: "#161b22", borderRadius: 8, border: "1px solid #f85149", textAlign: "center", color: "#f85149" }}>
              ⚠️ Only Upbit KYC verified wallets can use this protocol.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
