import { useEffect } from "react"
import { useConnect, useAccount } from "wagmi"
import metamaskLogo from "../assets/metamask.svg"
import okxLogo from "../assets/okx.svg"
import trustLogo from "../assets/trust.png"
import bitgetLogo from "../assets/bitget.svg"
import coinbaseLogo from "../assets/coinbase.svg"

const WALLETS = [
  { id: "metaMask", name: "MetaMask", img: metamaskLogo },
  { id: "okxWallet", name: "OKX Wallet", img: okxLogo },
  { id: "trustWallet", name: "Trust Wallet", img: trustLogo },
  { id: "bitgetWallet", name: "Bitget Wallet", img: bitgetLogo },
  { id: "coinbaseWallet", name: "Coinbase Wallet", img: coinbaseLogo },
]

export default function WalletModal({ onClose }: { onClose: () => void }) {
  const { connectors, connect } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (isConnected) onClose()
  }, [isConnected, onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "var(--bg-overlay)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="card animate-scale p-5" style={{ width: 320 }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Connect Wallet</span>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-dim)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="eyebrow mb-4" style={{ display: "block" }}>Choose a wallet</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {connectors.map(c => {
            const w = WALLETS.find(w => w.id === c.id)
            if (!w) return null
            return (
              <button key={c.id} onClick={() => connect({ connector: c })}
                style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-card)",
                  background: "transparent", color: "var(--text-primary)", fontSize: 14,
                  fontWeight: 500, transition: "all .18s", cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.borderColor = "var(--border-card-hover)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--border-card)" }}>
                <img src={w.img} alt={w.name}
                  style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{w.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )
          })}
        </div>
        <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: "var(--border-card)" }}>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
            By connecting, you agree to the terms of service
          </span>
        </div>
      </div>
    </div>
  )
}
