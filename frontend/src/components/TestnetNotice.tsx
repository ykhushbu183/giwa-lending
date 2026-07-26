export default function TestnetNotice() {
  return (
    <div
      style={{
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
