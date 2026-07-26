import { useState } from "react"
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from "wagmi"
import { createPublicClient, http } from "viem"
import { GIWA, GIWA_CHAIN, TOKEN, POOL, TOKEN_ABI, POOL_ABI, fmt, toB, calcHealth } from "../config"
import { toast } from "../components/Toast"

type Act = "supply" | "withdraw" | "borrow" | "repay"

const GIWA_CLIENT = createPublicClient({
  chain: GIWA_CHAIN,
  transport: http("https://sepolia-rpc.giwa.io"),
})

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite", display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function ActionBtn({ children, onClick, color, loading }: {
  children: React.ReactNode; onClick: () => void; color: string; loading?: boolean
}) {
  return (
    <button disabled={loading} onClick={onClick}
      className="w-full rounded-lg border-none text-sm font-semibold flex items-center justify-center gap-2"
      style={{ padding: "11px 0", background: color, color: "#000", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export default function MarketPage() {
  const { address, chainId } = useAccount()
  const [mode, setMode] = useState<Act>("supply")
  const [amt, setAmt] = useState("")
  const [mint, setMint] = useState("100")
  const [loading, setLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState("")
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const { data: sym } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "symbol", query: { enabled: !!address } })
  const { data: bal } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address } })
  const { data: allow } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "allowance", args: [address!, POOL], query: { enabled: !!address } })
  const { data: tDep } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalDeposits", query: { enabled: !!address } })
  const { data: tBor } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalBorrows", query: { enabled: !!address } })
  const { data: userInfo } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "getUserInfo", args: [address!], query: { enabled: !!address } })

  const uDep = userInfo?.[0] ?? BigInt(0)
  const uBor = userInfo?.[1] ?? BigInt(0)
  const uCol = userInfo?.[2] ?? BigInt(0)
  const lInt = userInfo?.[3] ?? BigInt(0)
  const bInt = userInfo?.[4] ?? BigInt(0)
  const util = tDep === BigInt(0) ? BigInt(0) : (tBor ?? BigInt(0)) * BigInt(100) / (tDep ?? BigInt(1))
  const h = calcHealth(uDep, uBor)
  const na = allow !== undefined && amt ? BigInt(allow.toString()) < toB(amt) : true
  const symStr = typeof sym === "string" ? sym : "GLT"

  async function execTx(config: any, pendingLabel: string, successLabel: string) {
    setLoadingLabel(pendingLabel)
    try {
      const hash = await writeContractAsync(config)
      toast(`${pendingLabel}`, "pending")
      const receipt = await GIWA_CLIENT.waitForTransactionReceipt({ hash })
      if (receipt.status === "reverted") {
        toast(`Transaction reverted on-chain`, "error")
        throw new Error("reverted")
      }
      toast(`${successLabel}`, "success", hash)
    } catch (e: any) {
      const m = e?.shortMessage || e?.message || ""
      const isRejected = m.includes("denied") || m.includes("rejected")
      if (isRejected) {
        toast(`Transaction cancelled`, "error")
      } else if (e?.message !== "reverted") {
        toast(`Transaction failed`, "error")
      }
      throw e
    }
  }

  async function run(action: string, fn: () => Promise<void>) {
    setLoading(true)
    try {
      await fn()
    } finally {
      setLoading(false)
      setLoadingLabel("")
    }
  }

  async function handleSupply() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return
    if (na) {
      await execTx(
        { address: TOKEN, abi: TOKEN_ABI, functionName: "approve", args: [POOL, amount] },
        `Approving ${fmt(amount, 2)} ${symStr}...`,
        `${fmt(amount, 2)} ${symStr} approved!`
      )
    }
    await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "deposit", args: [amount] },
      `Supplying ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} supplied!`
    )
  }

  async function handleWithdraw() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return
    await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "withdraw", args: [amount] },
      `Withdrawing ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} withdrawn!`
    )
  }

  async function handleBorrow() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return
    await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "borrow", args: [amount] },
      `Borrowing ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} borrowed!`
    )
  }

  async function handleRepay() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return
    if (allow !== undefined && BigInt(allow.toString()) < amount) {
      await execTx(
        { address: TOKEN, abi: TOKEN_ABI, functionName: "approve", args: [POOL, amount] },
        `Approving ${fmt(amount, 2)} ${symStr}...`,
        `${fmt(amount, 2)} ${symStr} approved!`
      )
    }
    await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "repay", args: [amount] },
      `Repaying ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} repaid!`
    )
  }

  async function handleMint() {
    const amount = toB(mint)
    if (amount <= BigInt(0)) return
    await execTx(
      { address: TOKEN, abi: TOKEN_ABI, functionName: "mint", args: [amount] },
      `Minting ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} minted!`
    )
  }

  const ok = chainId === GIWA

  if (!address) {
    return (
      <div className="animate-in text-center" style={{ maxWidth: 560, margin: "0 auto", padding: "60px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>GiwaLend</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>Dojang-attested lending protocol — connect to verify</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
          style={{ padding: "12px 28px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
          Connect Wallet
        </button>
        <div className="flex justify-center gap-5 mt-7 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>1. Connect</span><span style={{ color: "var(--text-dim)" }}>→</span><span>2. Mint GLT</span><span style={{ color: "var(--text-dim)" }}>→</span><span>3. Supply</span><span style={{ color: "var(--text-dim)" }}>→</span><span>4. Borrow</span>
        </div>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="animate-in" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
        <div className="card text-center" style={{ padding: 24, borderColor: "var(--accent-yellow)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--accent-yellow)" }}>Wrong Network</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Switch to GIWA Sepolia (Chain ID: 91342)</div>
          <button onClick={async () => {
            try {
              await switchChain({ chainId: GIWA })
            } catch (e: any) {
              if (e?.code === 4902) {
                try {
                  await (window as any).ethereum?.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x" + GIWA.toString(16), chainName: "GIWA Sepolia", rpcUrls: ["https://sepolia-rpc.giwa.io"], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, blockExplorerUrls: ["https://sepolia-explorer.giwa.io"] }] })
                } catch {}
              }
            }
          }}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
            Add / Switch GIWA Sepolia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 24 }}>🪙</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{symStr}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "monospace" }}>GIWA Sepolia</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Balance</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{fmt(bal ?? BigInt(0), 2)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3" style={{ padding: 16 }}>
          {[
            { l: "Supply APY", v: "5%", c: "var(--accent-green)" },
            { l: "Borrow APR", v: "10%", c: "var(--accent-yellow)" },
            { l: "Utilization", v: `${util.toString()}%`, c: "var(--text-primary)" },
          ].map(x => (
            <div key={x.l} style={{ textAlign: "center", padding: "8px 0" }}>
              <div className="card-badge" style={{ marginBottom: 4, display: "block" }}>{x.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: x.c }}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-card)" }}>
          <div className="flex gap-1 p-0.5 rounded-lg"
            style={{ background: "var(--bg-accent-soft)" }}>
            {(["supply", "withdraw", "borrow", "repay"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setAmt("") }}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500,
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? (m === "supply" || m === "repay" ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text-secondary)",
                  transition: "all .15s",
                }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>
            {mode === "supply" && <>Supply <strong>{symStr}</strong> to earn <strong style={{ color: "var(--accent-green)" }}>5% APY</strong></>}
            {mode === "withdraw" && <>Withdraw <strong>{symStr}</strong> · Supplied: <strong>{fmt(uDep, 2)}</strong></>}
            {mode === "borrow" && <>Borrow <strong>{symStr}</strong> at <strong style={{ color: "var(--accent-yellow)" }}>10% APR</strong> · Max: <strong>{fmt(uCol, 2)}</strong></>}
            {mode === "repay" && <>Repay <strong>{symStr}</strong> · Borrowed: <strong>{fmt(uBor, 2)}</strong></>}
          </div>
          <div className="flex gap-2">
            <input value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 14 }} />
            <button onClick={() => {
              const v = mode === "supply" ? (bal ?? BigInt(0)) : mode === "withdraw" ? uDep : mode === "borrow" ? uCol : uBor
              setAmt(fmt(v, 6))
            }}
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-card)", background: "transparent", color: "var(--text-secondary)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
              MAX
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            {mode === "supply" && na && (
              <ActionBtn onClick={() => run("supply", handleSupply)} color="var(--accent-yellow)" loading={loading}>
                Approve Pool
              </ActionBtn>
            )}
            {mode === "supply" && !na && (
              <ActionBtn onClick={() => run("supply", handleSupply)} color="var(--accent-green)" loading={loading}>
                Supply {symStr}
              </ActionBtn>
            )}
            {mode === "withdraw" && (
              <ActionBtn onClick={() => run("withdraw", handleWithdraw)} color="var(--accent-yellow)" loading={loading}>
                Withdraw {symStr}
              </ActionBtn>
            )}
            {mode === "borrow" && (
              <ActionBtn onClick={() => run("borrow", handleBorrow)} color="var(--accent-yellow)" loading={loading}>
                Borrow {symStr}
              </ActionBtn>
            )}
            {mode === "repay" && (
              <ActionBtn onClick={() => run("repay", handleRepay)} color="var(--accent-green)" loading={loading}>
                Repay {symStr}
              </ActionBtn>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Get GLT Tokens</span>
          <span className="card-badge">Step 1</span>
        </div>
        <div style={{ padding: "0 18px 6px" }}>
          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            GLT is a test ERC20 token with a <strong>public mint function</strong> — only Dojang-verified users can mint.
            No faucet, no real value. Only GIWA Sepolia gas fees apply.
          </p>
        </div>
        <div style={{ padding: "6px 18px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <input value={mint} onChange={e => setMint(e.target.value)}
            style={{ width: 100, padding: "10px 14px", borderRadius: 8, fontSize: 14, textAlign: "center" }} />
          <ActionBtn onClick={() => run("mint", handleMint)} color="var(--btn-primary-bg)" loading={loading}>
            Mint {symStr}
          </ActionBtn>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Your Position</span>
          <span style={{ fontSize: 11, color: h.color, fontWeight: 500, fontFamily: "monospace" }}>{h.label}</span>
        </div>
        <div style={{ padding: "14px 18px" }}>
          {[
            { l: "Supplied", v: fmt(uDep, 4), c: "var(--text-primary)" },
            { l: "Interest Earned", v: `+${fmt(lInt, 4)}`, c: "var(--accent-green)" },
            { l: "Borrowed", v: fmt(uBor, 4), c: "var(--text-primary)" },
            { l: "Interest Owing", v: `-${fmt(bInt, 4)}`, c: "var(--accent-red)" },
            { l: "Collateral", v: fmt(uCol, 4), c: "var(--text-primary)" },
          ].map(x => (
            <div key={x.l} className="flex justify-between py-1.5 text-sm"
              style={{ borderBottom: "1px solid var(--border-card)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{x.l}</span>
              <span style={{ fontWeight: 600, color: x.c }}>{x.v}</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: "var(--text-secondary)" }}>Health Factor</span>
              <span style={{ color: h.color, fontWeight: 600 }}>{h.pct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden"
              style={{ background: "var(--bg-accent-soft)" }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${h.pct}%`, background: h.color, transition: "width .5s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
