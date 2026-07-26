import { useState, useRef } from "react"
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from "wagmi"
import { createPublicClient, http } from "viem"
import { GIWA, GIWA_CHAIN, TOKEN, POOL, TOKEN_ABI, POOL_ABI, fmt, toB, calcHealth } from "../config"
import { toast, updateToast } from "../components/Toast"

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

function ActionBtn({ children, onClick, color, action, loadingAction }: {
  children: React.ReactNode; onClick: () => void; color: string; action: string; loadingAction: string
}) {
  const active = loadingAction === action
  return (
    <button disabled={!!loadingAction} onClick={onClick}
      className="w-full py-3 rounded-xl text-sm font-semibold border-none flex items-center justify-center gap-2 transition-all duration-150"
      style={{
        background: color, color: "#000",
        opacity: loadingAction && loadingAction !== action ? 0.4 : active ? 0.8 : 1,
        cursor: loadingAction ? "not-allowed" : "pointer",
      }}
      onMouseEnter={e => { if (!loadingAction) e.currentTarget.style.opacity = "0.85" }}
      onMouseLeave={e => { if (!loadingAction) e.currentTarget.style.opacity = "1" }}>
      {active && <Spinner />}
      {children}
    </button>
  )
}

export default function MarketPage() {
  const { address, chainId } = useAccount()
  const [mode, setMode] = useState<Act>("supply")
  const [amt, setAmt] = useState("")
  const [mint, setMint] = useState("100")
  const [loadingAction, setLoadingAction] = useState("")
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()
  const toastId = useRef(0)

  const POLL = { refetchInterval: 3000 }
  const { data: sym } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "symbol", query: { enabled: !!address, ...POLL } })
  const { data: bal } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address, ...POLL } })
  const { data: allow } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "allowance", args: [address!, POOL], query: { enabled: !!address, ...POLL } })
  const { data: tDep } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalDeposits", query: { enabled: !!address, ...POLL } })
  const { data: tBor } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalBorrows", query: { enabled: !!address, ...POLL } })
  const { data: userInfo } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "getUserInfo", args: [address!], query: { enabled: !!address, ...POLL } })

  const uDep = userInfo?.[0] ?? BigInt(0)
  const uBor = userInfo?.[1] ?? BigInt(0)
  const uCol = userInfo?.[2] ?? BigInt(0)
  const lInt = userInfo?.[3] ?? BigInt(0)
  const bInt = userInfo?.[4] ?? BigInt(0)
  const util = tDep === BigInt(0) ? BigInt(0) : (tBor ?? BigInt(0)) * BigInt(100) / (tDep ?? BigInt(1))
  const h = calcHealth(uDep, uBor)
  const symStr = typeof sym === "string" ? sym : "GLT"

  function showToast(message: string, type: "pending" | "success" | "error", txHash?: string) {
    if (toastId.current) {
      updateToast(toastId.current, message, type, txHash)
    } else {
      toastId.current = toast(message, type, txHash)
    }
  }

  function resetToast() { toastId.current = 0 }

  async function execTx(config: any, pendingLabel: string, successLabel: string) {
    try {
      const hash = await writeContractAsync(config)
      showToast(pendingLabel, "pending")
      const receipt = await GIWA_CLIENT.waitForTransactionReceipt({ hash })
      if (receipt.status === "reverted") {
        showToast("Transaction reverted on-chain", "error")
        return false
      }
      showToast(successLabel, "success", hash)
      return true
    } catch (e: any) {
      const m = e?.shortMessage || e?.message || ""
      const isRejected = m.includes("denied") || m.includes("rejected")
      showToast(isRejected ? "Transaction cancelled" : "Transaction failed", "error")
      return false
    }
  }

  async function run(action: string, fn: () => Promise<boolean>) {
    setLoadingAction(action)
    resetToast()
    const ok = await fn()
    setLoadingAction("")
    if (ok) resetToast()
  }

  async function handleSupply() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return false
    if (allow !== undefined && BigInt(allow.toString()) < amount) {
      const approved = await execTx(
        { address: TOKEN, abi: TOKEN_ABI, functionName: "approve", args: [POOL, amount] },
        `Approving ${fmt(amount, 2)} ${symStr}...`,
        `${fmt(amount, 2)} ${symStr} approved!`
      )
      if (!approved) return false
    }
    return await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "deposit", args: [amount] },
      `Supplying ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} supplied!`
    )
  }

  async function handleWithdraw() {
    const amount = toB(amt); if (amount <= BigInt(0)) return false
    return await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "withdraw", args: [amount] },
      `Withdrawing ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} withdrawn!`
    )
  }

  async function handleBorrow() {
    const amount = toB(amt); if (amount <= BigInt(0)) return false
    return await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "borrow", args: [amount] },
      `Borrowing ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} borrowed!`
    )
  }

  async function handleRepay() {
    const amount = toB(amt)
    if (amount <= BigInt(0)) return false
    if (allow !== undefined && BigInt(allow.toString()) < amount) {
      const approved = await execTx(
        { address: TOKEN, abi: TOKEN_ABI, functionName: "approve", args: [POOL, amount] },
        `Approving ${fmt(amount, 2)} ${symStr}...`,
        `${fmt(amount, 2)} ${symStr} approved!`
      )
      if (!approved) return false
    }
    return await execTx(
      { address: POOL, abi: POOL_ABI, functionName: "repay", args: [amount] },
      `Repaying ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} repaid!`
    )
  }

  async function handleMint() {
    const amount = toB(mint); if (amount <= BigInt(0)) return false
    return await execTx(
      { address: TOKEN, abi: TOKEN_ABI, functionName: "mint", args: [amount] },
      `Minting ${fmt(amount, 2)} ${symStr}...`,
      `${fmt(amount, 2)} ${symStr} minted!`
    )
  }

  const ok = chainId === GIWA

  if (!address) {
    return (
      <div className="animate-in px-6 md:px-12 lg:px-20" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-lg mx-auto text-center" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span style={{ fontSize: 28 }}>🏦</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>GiwaLend</h1>
          <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>Dojang-attested lending protocol — connect to verify</p>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
            className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold border-none"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
            Connect Wallet
          </button>
          <div className="flex justify-center gap-4 mt-10 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>1. Connect</span><span style={{ color: "var(--text-dim)" }}>→</span>
            <span>2. Mint GLT</span><span style={{ color: "var(--text-dim)" }}>→</span>
            <span>3. Supply</span><span style={{ color: "var(--text-dim)" }}>→</span>
            <span>4. Borrow</span>
          </div>
        </div>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="animate-in px-6 md:px-12 lg:px-20" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="max-w-lg mx-auto">
          <div className="card text-center p-8" style={{ borderColor: "var(--accent-yellow)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--accent-yellow)" }}>Wrong Network</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Switch to GIWA Sepolia (Chain ID: 91342)</p>
            <button onClick={async () => {
              try { await switchChain({ chainId: GIWA }) } catch (e: any) {
                if (e?.code === 4902) {
                  try { await (window as any).ethereum?.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x" + GIWA.toString(16), chainName: "GIWA Sepolia", rpcUrls: ["https://sepolia-rpc.giwa.io"], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, blockExplorerUrls: ["https://sepolia-explorer.giwa.io"] }] }) } catch {}
                }
              }
            }}
              className="px-6 py-3 rounded-xl text-sm font-semibold border-none"
              style={{ background: "var(--accent-yellow)", color: "#000" }}>
              Add / Switch GIWA Sepolia
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in px-6 md:px-12 lg:px-20" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div className="max-w-3xl mx-auto">
        <div className="eyebrow mb-4">Market</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>
          Lend & Borrow
        </h1>

        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                <span style={{ fontSize: 22 }}>🪙</span>
              </div>
              <div>
                <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{symStr}</div>
                <div className="eyebrow">GIWA Sepolia</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="eyebrow mb-1">Balance</div>
              <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(bal ?? BigInt(0), 4)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { l: "Supply APY", v: "5%", c: "var(--accent-green)" },
              { l: "Borrow APR", v: "10%", c: "var(--accent-yellow)" },
              { l: "Utilization", v: `${util.toString()}%`, c: "var(--text-primary)" },
            ].map(x => (
              <div key={x.l} className="text-center py-3" style={{ background: "var(--bg-accent-soft)", borderRadius: 10 }}>
                <div className="card-badge mb-1">{x.l}</div>
                <div className="text-xl font-bold" style={{ color: x.c }}>{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8 mb-8">
          <div className="flex gap-2 p-1 rounded-xl mb-6" style={{ background: "var(--bg-accent-soft)" }}>
            {(["supply", "withdraw", "borrow", "repay"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setAmt("") }}
                className="flex-1 py-2 rounded-lg text-sm font-medium border-none transition-all duration-150"
                style={{
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? (m === "supply" || m === "repay" ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text-secondary)",
                }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {mode === "supply" && <>Supply <strong style={{ color: "var(--text-primary)" }}>{symStr}</strong> to earn <strong style={{ color: "var(--accent-green)" }}>5% APY</strong></>}
            {mode === "withdraw" && <>Withdraw <strong style={{ color: "var(--text-primary)" }}>{symStr}</strong> · Supplied: <strong>{fmt(uDep, 4)}</strong></>}
            {mode === "borrow" && <>Borrow <strong style={{ color: "var(--text-primary)" }}>{symStr}</strong> at <strong style={{ color: "var(--accent-yellow)" }}>10% APR</strong></>}
            {mode === "repay" && <>Repay <strong style={{ color: "var(--text-primary)" }}>{symStr}</strong> · Borrowed: <strong>{fmt(uBor, 4)}</strong></>}
          </div>

          <div className="flex gap-3 mb-3">
            <input value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00"
              className="flex-1 px-4 py-3 rounded-xl text-base border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-input)" }} />
            <button onClick={() => {
              const v = mode === "supply" ? (bal ?? BigInt(0)) : mode === "withdraw" ? uDep : mode === "borrow" ? uCol : uBor
              setAmt(fmt(v, 6))
            }}
              className="px-4 rounded-xl text-xs font-semibold border transition-all duration-150"
              style={{ borderColor: "var(--border-card)", background: "transparent", color: "var(--text-secondary)" }}>
              MAX
            </button>
          </div>

          <div className="text-xs text-right mb-5" style={{ color: "var(--text-dim)" }}>
            {mode === "supply" && <>Max: {fmt(bal ?? BigInt(0), 4)} {symStr}</>}
            {mode === "withdraw" && <>Max: {fmt(uDep, 4)} {symStr}</>}
            {mode === "borrow" && <>Max: {fmt(uCol, 4)} {symStr}</>}
            {mode === "repay" && <>Max: {fmt(uBor, 4)} {symStr}</>}
          </div>

          {mode === "supply" && (
            <ActionBtn onClick={() => run("supply", handleSupply)} color="var(--accent-green)" action="supply" loadingAction={loadingAction}>
              Supply {symStr}
            </ActionBtn>
          )}
          {mode === "withdraw" && (
            <ActionBtn onClick={() => run("withdraw", handleWithdraw)} color="var(--accent-yellow)" action="withdraw" loadingAction={loadingAction}>
              Withdraw {symStr}
            </ActionBtn>
          )}
          {mode === "borrow" && (
            <ActionBtn onClick={() => run("borrow", handleBorrow)} color="var(--accent-yellow)" action="borrow" loadingAction={loadingAction}>
              Borrow {symStr}
            </ActionBtn>
          )}
          {mode === "repay" && (
            <ActionBtn onClick={() => run("repay", handleRepay)} color="var(--accent-green)" action="repay" loadingAction={loadingAction}>
              Repay {symStr}
            </ActionBtn>
          )}
        </div>

        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Get GLT Tokens</h2>
            <span className="card-badge">Step 1</span>
          </div>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            GLT is a test ERC20 token with a public mint function — only Dojang-verified users can mint.
            No faucet, no real value. Only GIWA Sepolia gas fees apply.
          </p>
          <div className="flex gap-3 items-center">
            <input value={mint} onChange={e => setMint(e.target.value)}
              className="px-4 py-3 rounded-xl text-base border"
              style={{ width: 120, background: "var(--bg-input)", borderColor: "var(--border-input)", color: "var(--text-input)", textAlign: "center" }} />
            <ActionBtn onClick={() => run("mint", handleMint)} color="var(--btn-primary-bg)" action="mint" loadingAction={loadingAction}>
              Mint {symStr}
            </ActionBtn>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Your Position</h2>
            <span className="text-sm font-mono font-semibold" style={{ color: h.color }}>{h.label}</span>
          </div>
          {[
            { l: "Supplied", v: fmt(uDep, 4), c: "var(--text-primary)" },
            { l: "Interest Earned", v: `+${fmt(lInt, 4)}`, c: "var(--accent-green)" },
            { l: "Borrowed", v: fmt(uBor, 4), c: "var(--text-primary)" },
            { l: "Interest Owing", v: `-${fmt(bInt, 4)}`, c: "var(--accent-red)" },
            { l: "Collateral", v: fmt(uCol, 4), c: "var(--text-primary)" },
          ].map(x => (
            <div key={x.l} className="flex justify-between py-2.5 text-sm border-b"
              style={{ borderColor: "var(--border-card)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{x.l}</span>
              <span className="font-semibold" style={{ color: x.c }}>{x.v}</span>
            </div>
          ))}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: "var(--text-secondary)" }}>Health Factor</span>
              <span className="font-semibold" style={{ color: h.color }}>{h.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-accent-soft)" }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${h.pct}%`, background: h.color, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
