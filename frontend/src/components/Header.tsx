import { useState, useCallback } from "react"
import { NavLink } from "react-router-dom"
import { useAccount } from "wagmi"
import { GIWA } from "../config"
import WalletPanel from "./WalletPanel"

export default function Header({ onConnectRequest }: {
  onConnectRequest: () => void
}) {
  const { address, isConnected, chainId } = useAccount()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const togglePanel = useCallback(() => setPanelOpen(v => !v), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  return (
    <><header className="border-b backdrop-blur-sm sticky top-0 z-40"
      style={{ borderColor: "var(--border-header)", backgroundColor: "var(--bg-header)" }}>
      <div className="px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>GiwaLend</span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "Home", to: "/" },
              { label: "Market", to: "/market" },
              { label: "Dashboard", to: "/dashboard" },
            ].map(n => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}
                className={({ isActive }) =>
                  `nav-link text-base transition-all duration-150 pb-1 ${isActive ? "font-semibold nav-active" : "font-medium"}`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <style>{`
            .nav-link { color: var(--text-dim); border-bottom: 2px solid transparent; }
            .nav-link:hover { color: var(--text-primary) !important; }
            .nav-link.nav-active { color: var(--text-primary) !important; border-bottom-color: var(--text-primary); }
            .nav-link.nav-active:hover { color: var(--text-primary) !important; }
          `}</style>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button onClick={togglePanel}
              className="wallet-trigger flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-150"
              style={{ backgroundColor: "var(--bg-card)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-card-hover)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--bg-card)"}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chainId === GIWA ? "var(--accent-green)" : "var(--accent-yellow)" }} />
              <span className="text-base font-mono" style={{ color: "var(--text-muted)" }}>
                {address?.slice(0, 4)}...{address?.slice(-3)}
              </span>
            </button>
          ) : (
            <button onClick={onConnectRequest} className="btn-primary px-5 py-2 rounded-lg text-base font-medium">
              Connect Wallet
            </button>
          )}

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg" style={{ color: "var(--text-dim)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <><path d="M3 6h18M3 12h18M3 18h18"/></>}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t px-6 py-3 flex flex-col gap-1" style={{ borderColor: "var(--border-header)", backgroundColor: "var(--bg-header)" }}>
          {[
            { label: "Home", to: "/" },
            { label: "Market", to: "/market" },
            { label: "Dashboard", to: "/dashboard" },
          ].map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setMobileOpen(false)}
              className="text-base font-medium py-2 px-3 rounded-lg"
              style={({ isActive }) => ({
                color: isActive ? "var(--text-primary)" : "var(--text-dim)",
                backgroundColor: isActive ? "var(--bg-card)" : "transparent",
              })}>
              {n.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
    <WalletPanel open={panelOpen} onClose={closePanel} />
    </>
  )
}
