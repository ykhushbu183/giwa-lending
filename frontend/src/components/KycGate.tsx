import { useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { DOJANG_SCROLL, DOJANG_ABI, UPBIT_ATTESTER } from "../config"

export default function KycGate({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const [dismissed, setDismissed] = useState(false)
  const { data: verified } = useReadContract({
    address: DOJANG_SCROLL,
    abi: DOJANG_ABI,
    functionName: "isVerified",
    args: [address!, UPBIT_ATTESTER],
    query: { enabled: !!address },
  })

  const showNotice = isConnected && !dismissed && verified === false

  return (
    <>
      {showNotice && (
        <div
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            borderBottom: "1px solid var(--border-header)",
            padding: "10px 16px",
            fontSize: 13,
            color: "var(--text-secondary)",
            textAlign: "center",
            position: "relative",
          }}
        >
          🧪 <strong>Public Testnet</strong> — This dApp is currently open for everyone to test.
          Once live, only wallets with valid Dojang attestations (KYC) will be able to use it.
          <button
            onClick={() => setDismissed(true)}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer",
              fontSize: 16, lineHeight: 1, padding: "4px 8px",
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </>
  )
}
