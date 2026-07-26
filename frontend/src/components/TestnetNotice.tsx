export default function TestnetNotice() {
  return (
    <div
      style={{
        padding: "16px 24px",
        fontSize: 16,
        color: "var(--text-primary)",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderRadius: 12,
        textAlign: "center",
        lineHeight: 1.7,
        margin: "20px auto 0",
        maxWidth: 800,
      }}
    >
      🧪 <strong>Public Testnet</strong> — This dApp is currently open for everyone to test.
      Once live, only wallets with valid Dojang attestations (KYC) will be able to use it.
    </div>
  )
}
