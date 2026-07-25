import { useAccount, useReadContract } from "wagmi"
import { DOJANG_SCROLL, DOJANG_ABI, UPBIT_ATTESTER } from "../config"

export default function KycGate({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const { data: verified, isLoading } = useReadContract({
    address: DOJANG_SCROLL,
    abi: DOJANG_ABI,
    functionName: "isVerified",
    args: [address!, UPBIT_ATTESTER],
    query: { enabled: !!address },
  })

  if (!isConnected) return <>{children}</>

  if (isLoading) {
    return (
      <div className="animate-in flex items-center justify-center" style={{ minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
            Verifying KYC status...
          </div>
          <div style={{ width: 24, height: 24, border: "2px solid var(--border-card)", borderTopColor: "var(--text-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        </div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="animate-in" style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Access Restricted</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
          GiwaLend is a <strong>KYC-gated application</strong>. Only verified users can supply, borrow, or use the protocol.
        </p>
        <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.6 }}>
          Your wallet (<code style={{ fontSize: 12, fontFamily: "monospace" }}>{address?.slice(0, 6)}...{address?.slice(-4)}</code>)
          does not have a Upbit Korea KYC attestation. Verify your wallet at the GIWA Playground.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
