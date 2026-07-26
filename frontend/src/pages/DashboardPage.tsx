import { useAccount, useReadContract, useSwitchChain } from "wagmi"
import { GIWA, TOKEN, POOL, TOKEN_ABI, POOL_ABI, fmt, calcHealth } from "../config"

export default function DashboardPage() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const ok = chainId === GIWA

  const POLL = { refetchInterval: 3000 }
  const { data: sym } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "symbol", query: { enabled: !!address, ...POLL } })
  const { data: tDep } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalDeposits", query: { enabled: !!address, ...POLL } })
  const { data: tBor } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "totalBorrows", query: { enabled: !!address, ...POLL } })
  const { data: userInfo } = useReadContract({ address: POOL, abi: POOL_ABI, functionName: "getUserInfo", args: [address!], query: { enabled: !!address, ...POLL } })

  const uDep = userInfo?.[0] ?? BigInt(0)
  const uBor = userInfo?.[1] ?? BigInt(0)
  const lInt = userInfo?.[3] ?? BigInt(0)
  const bInt = userInfo?.[4] ?? BigInt(0)
  const util = tDep === BigInt(0) ? BigInt(0) : (tBor ?? BigInt(0)) * BigInt(100) / (tDep ?? BigInt(1))
  const h = calcHealth(uDep, uBor)
  const symStr = typeof sym === "string" ? sym : "GLT"

  if (!address) {
    return (
      <div className="animate-in px-6 md:px-12 lg:px-20" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-lg mx-auto text-center" style={{ paddingTop: 60, paddingBottom: 60 }}>
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
            <span style={{ fontSize: 28 }}>📊</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>Connect your Dojang-verified wallet to view your position</p>
          <button onClick={() => window.dispatchEvent(new CustomEvent("open-wallet-modal"))}
            className="px-8 py-3.5 rounded-xl text-base font-semibold border-none"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
            Connect Wallet
          </button>
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
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Switch to GIWA Sepolia (Chain ID: {GIWA})</p>
            <button onClick={async () => { try { await switchChain({ chainId: GIWA }) } catch {} }}
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
      <div className="max-w-3xl mx-auto">
        <div className="eyebrow mb-4">Dashboard</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-10" style={{ color: "var(--text-primary)" }}>
          Your Position
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { l: "Net Worth", v: fmt(uDep, 4), s: `+${fmt(lInt, 4)} earned`, sc: "var(--accent-green)" },
            { l: "Borrowed", v: fmt(uBor, 4), s: `-${fmt(bInt, 4)} owing`, sc: "var(--accent-red)" },
            { l: "Health", v: h.label, s: `${h.pct}% · 150% collat.`, sc: "var(--text-secondary)" },
          ].map(x => (
            <div key={x.l} className="card p-6 text-center">
              <div className="card-badge mb-3">{x.l}</div>
              <div className="text-2xl font-bold mb-1" style={{ color: x.l === "Health" ? h.color : "var(--text-primary)" }}>{x.v}</div>
              <div className="text-xs" style={{ color: x.sc }}>{x.s}</div>
            </div>
          ))}
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Supplies</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                <span style={{ fontSize: 20 }}>🪙</span>
              </div>
              <div>
                <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{symStr}</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(uDep, 4)} supplied</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-base font-bold" style={{ color: "var(--accent-green)" }}>+{fmt(lInt, 4)}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>earned</div>
            </div>
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Borrows</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
                <span style={{ fontSize: 20 }}>🪙</span>
              </div>
              <div>
                <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{symStr}</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(uBor, 4)} borrowed</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="text-base font-bold" style={{ color: "var(--accent-yellow)" }}>{fmt(bInt, 4)}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>owing</div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>Pool Stats</h2>
          {[
            { l: "Total Supplied", v: fmt(tDep ?? BigInt(0), 4), c: "var(--accent-green)" },
            { l: "Total Borrowed", v: fmt(tBor ?? BigInt(0), 4), c: "var(--accent-yellow)" },
            { l: "Utilization", v: `${util.toString()}%` },
            { l: "Collateral Ratio", v: "150%" },
          ].map(x => (
            <div key={x.l} className="flex justify-between py-2.5 text-sm border-b"
              style={{ borderColor: "var(--border-card)" }}>
              <span style={{ color: "var(--text-secondary)" }}>{x.l}</span>
              <span className="font-semibold" style={{ color: x.c || "var(--text-primary)" }}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
