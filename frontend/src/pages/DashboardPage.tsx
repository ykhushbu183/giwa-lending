import { useAccount, useReadContract, useSwitchChain } from "wagmi"
import { GIWA, TOKEN, POOL, TOKEN_ABI, POOL_ABI, fmt, calcHealth } from "../config"

export default function DashboardPage() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const ok = chainId === GIWA

  const { data: sym } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "symbol", query: { enabled: !!address } })
  const { data: tDep } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalDeposits", query: { enabled: !!address } })
  const { data: tBor } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalBorrows", query: { enabled: !!address } })
  const { data: userInfo } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "getUserInfo", args: [address!], query: { enabled: !!address } })

  const uDep = userInfo?.[0] ?? BigInt(0)
  const uBor = userInfo?.[1] ?? BigInt(0)
  const lInt = userInfo?.[3] ?? BigInt(0)
  const bInt = userInfo?.[4] ?? BigInt(0)
  const util = tDep === BigInt(0) ? BigInt(0) : (tBor ?? BigInt(0)) * BigInt(100) / (tDep ?? BigInt(1))
  const h = calcHealth(uDep, uBor)

  if (!address) {
    return (
      <div className="animate-in text-center" style={{ maxWidth: 560, margin: "0 auto", padding: "60px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14 }}>Connect your Dojang-verified wallet to view your position</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
          style={{ padding: "12px 28px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
          Connect Wallet
        </button>
      </div>
    )
  }

  if (!ok) {
    return (
      <div className="animate-in" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
        <div className="card text-center" style={{ padding: 24, borderColor: "var(--accent-yellow)" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--accent-yellow)" }}>Wrong Network</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Switch to GIWA Sepolia (Chain ID: {GIWA})</div>
          <button onClick={async () => { try { await switchChain({ chainId: GIWA }) } catch {} }}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
            Add / Switch GIWA Sepolia
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 16 }}>
        {[
          { l: "Net Worth", v: fmt(uDep, 2), s: `+${fmt(lInt, 4)} earned`, sc: "var(--accent-green)" },
          { l: "Borrowed", v: fmt(uBor, 2), s: `-${fmt(bInt, 4)} owing`, sc: "var(--accent-red)" },
          { l: "Health", v: h.label, s: `${h.pct}% · 150% collat.`, sc: "var(--text-secondary)" },
        ].map(x => (
          <div key={x.l} className="card text-center" style={{ padding: 16 }}>
            <div className="card-badge" style={{ marginBottom: 6, display: "block" }}>{x.l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: x.l === "Health" ? h.color : "var(--text-primary)" }}>{x.v}</div>
            <div style={{ fontSize: 11, color: x.sc, marginTop: 2 }}>{x.s}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-card)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Supplies</span>
        </div>
        <div className="flex justify-between items-center" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>🪙</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{typeof sym === "string" ? sym : "GLT"}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmt(uDep, 2)} supplied</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, color: "var(--accent-green)", fontSize: 13 }}>{fmt(lInt, 4)}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>earned</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-card)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Borrows</span>
        </div>
        <div className="flex justify-between items-center" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>🪙</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{typeof sym === "string" ? sym : "GLT"}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{fmt(uBor, 2)} borrowed</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 600, color: "var(--accent-yellow)", fontSize: 13 }}>{fmt(bInt, 4)}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>owing</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-card)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Pool Stats</span>
        </div>
        <div style={{ padding: "14px 18px" }}>
          {[
            { l: "Total Supplied", v: fmt(tDep ?? BigInt(0), 2), c: "var(--accent-green)" },
            { l: "Total Borrowed", v: fmt(tBor ?? BigInt(0), 2), c: "var(--accent-yellow)" },
            { l: "Utilization", v: `${util.toString()}%` },
            { l: "Collateral Ratio", v: "150%" },
          ].map(x => (
            <div key={x.l} className="flex justify-between py-1.5 text-sm"
              style={{ borderBottom: "1px solid var(--border-card)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{x.l}</span>
              <span style={{ fontWeight: 600, color: x.c || "var(--text-primary)" }}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
