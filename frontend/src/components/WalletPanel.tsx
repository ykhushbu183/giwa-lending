import { useState, useEffect, useSyncExternalStore } from "react"
import { useAccount, useBalance, useDisconnect, useSwitchChain, useReadContract } from "wagmi"
import { formatEther } from "viem"
import { GIWA, GIWA_NET, TOKEN, TOKEN_ABI, fmt } from "../config"

function getProviderChainId() {
  if (typeof window === "undefined") return undefined
  const eth = (window as any).ethereum
  if (!eth?.chainId) return undefined
  return Number(eth.chainId)
}

function subscribeChainChanged(cb: () => void) {
  const eth = (window as any).ethereum
  eth?.on?.("chainChanged", cb)
  return () => eth?.removeListener?.("chainChanged", cb)
}

export default function WalletPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address, chainId: wagmiChainId } = useAccount()
  const providerChainId = useSyncExternalStore(subscribeChainChanged, getProviderChainId, getProviderChainId)
  const chainId = providerChainId ?? wagmiChainId
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [copied, setCopied] = useState(false)
  const ok = chainId === GIWA

  const { data: nativeBalance } = useBalance({ address, chainId: GIWA, query: { enabled: !!address } })
  const { data: gltBalance } = useReadContract({ address: TOKEN, abi: TOKEN_ABI, functionName: "balanceOf", args: [address!], query: { enabled: !!address } })

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  function handleCopy() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleSwitch() {
    try {
      await switchChain({ chainId: GIWA })
    } catch (e: any) {
      if (e?.code === 4902) {
        try {
          await (window as any).ethereum?.request({ method: "wallet_addEthereumChain", params: [GIWA_NET] })
        } catch {}
      }
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "var(--bg-overlay)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="card animate-scale" style={{ width: 340 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 h-14 border-b" style={{ borderColor: "var(--border-header)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Wallet</span>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-dim)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button onClick={handleCopy} className="p-1 rounded transition-colors" style={{ color: copied ? "var(--text-accent)" : "var(--text-dim)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {copied ? (
                      <polyline points="20 6 9 17 4 12"/>
                    ) : (
                      <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>
                    )}
                  </svg>
                </button>
              </div>
              <button onClick={() => { disconnect(); onClose() }}
                className="flex items-center justify-center rounded-lg transition-all duration-150 p-1.5"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444" }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                </svg>
              </button>
            </div>
          </div>

          {!ok && (
            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-card)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent-yellow)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--accent-yellow)" }}>Wrong Network</span>
              </div>
              <button onClick={handleSwitch}
                className="w-full py-2.5 rounded-lg border-none text-sm font-semibold text-center"
                style={{ background: "var(--accent-yellow)", color: "#000" }}>
                Switch to GIWA Sepolia
              </button>
              <p className="text-xs text-center mt-2" style={{ color: "var(--text-dim)" }}>
                Chain ID: {GIWA}
              </p>
            </div>
          )}

          {ok && (
            <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-card)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--accent-green)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--accent-green)" }}>GIWA Sepolia</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>ETH</span>
                  <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                    {nativeBalance ? Number(formatEther(nativeBalance.value)).toFixed(4) : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border-card)" }}>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>GLT</span>
                  <span className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                    {fmt(gltBalance ?? BigInt(0), 2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 py-3 border-t flex items-center gap-2" style={{ borderColor: "var(--border-card)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>GIWA Sepolia, Testnet</span>
          </div>
        </div>
      </div>
    </>
  )
}
