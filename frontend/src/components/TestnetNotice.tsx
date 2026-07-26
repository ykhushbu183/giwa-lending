import { useAccount, useReadContract } from "wagmi"
import { DOJANG_SCROLL, DOJANG_ABI, UPBIT_ATTESTER } from "../config"

export default function TestnetNotice() {
  const { address, isConnected } = useAccount()
  const { data: verified } = useReadContract({
    address: DOJANG_SCROLL,
    abi: DOJANG_ABI,
    functionName: "isVerified",
    args: [address!, UPBIT_ATTESTER],
    query: { enabled: !!address },
  })

  if (!isConnected || verified !== false) return null

  return (
    <div
      style={{
        marginTop: 24,
        marginLeft: 16,
        marginRight: 16,
        padding: "14px 20px",
        borderRadius: 12,
        fontSize: 15,
        color: "var(--text-primary)",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: 720,
        margin: "24px auto 0",
      }}
    >
      🧪 <strong>Public Testnet</strong> — This dApp is currently open for everyone to test.
      Once live, only wallets with valid Dojang attestations (KYC) will be able to use it.
    </div>
  )
}
