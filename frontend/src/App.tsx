import { useState, useEffect, Component } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, http, createConfig } from "wagmi"
import { injected, coinbaseWallet } from "wagmi/connectors"
import { GIWA_CHAIN } from "./config"
import Header from "./components/Header"
import WalletModal from "./components/WalletModal"
import ToastContainer from "./components/Toast"
import TestnetNotice from "./components/TestnetNotice"
import KycGate from "./components/KycGate"
import Home from "./pages/Home"
import MarketPage from "./pages/MarketPage"
import DashboardPage from "./pages/DashboardPage"

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error) {
    console.error("App crashed:", error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
          <div className="max-w-lg text-center">
            <h1 className="text-xl font-bold mb-4">Something went wrong</h1>
            <pre className="text-sm p-4 rounded-lg overflow-auto max-h-48 mb-4"
              style={{ color: "var(--accent-red)", background: "var(--bg-card)" }}>
              {this.state.error?.message}
            </pre>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="px-6 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)" }}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [GIWA_CHAIN],
  connectors: [
    injected({ target: "metaMask" }),
    injected({ target: "okxWallet" }),
    injected({
      target() {
        return {
          id: "trustWallet",
          name: "Trust Wallet",
          provider(window) {
            if (window?.trustwallet) return window.trustwallet
            return (window as any)?.ethereum?.providers?.find((p: any) => p.isTrustWallet)
          },
        }
      },
    }),
    injected({
      target() {
        return {
          id: "bitgetWallet",
          name: "Bitget Wallet",
          provider(window) {
            if (window?.bitkeep) return window.bitkeep
            return (window as any)?.ethereum?.providers?.find((p: any) => p.isBitKeep)
          },
        }
      },
    }),
    coinbaseWallet({ appName: "GiwaLend" }),
  ],
  transports: { [GIWA_CHAIN.id]: http(GIWA_CHAIN.rpcUrls.default.http[0]) },
})

export default function App() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handler = () => setShowModal(true)
    window.addEventListener("open-wallet-modal", handler)
    return () => window.removeEventListener("open-wallet-modal", handler)
  }, [])

  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Header onConnectRequest={() => setShowModal(true)} />
            <ToastContainer />
            <TestnetNotice />
            <Routes>
              <Route path="/" element={<Home onConnectRequest={() => setShowModal(true)} />} />
              <Route path="/market" element={<KycGate><MarketPage /></KycGate>} />
              <Route path="/dashboard" element={<KycGate><DashboardPage /></KycGate>} />
            </Routes>
            {showModal && <WalletModal onClose={() => setShowModal(false)} />}
          </BrowserRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}
