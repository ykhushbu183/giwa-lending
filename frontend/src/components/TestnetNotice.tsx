export default function TestnetNotice() {
  return (
    <div
      style={{
        padding: "12px 20px",
        fontSize: 14,
        color: "var(--text-primary)",
        backgroundColor: "var(--bg-header)",
        borderBottom: "1px solid var(--border-header)",
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      🧪 <strong>Public Testnet</strong> — This dApp is currently open for everyone to test.
      Once live, only wallets with valid Dojang attestations (KYC) will be able to use it.
    </div>
  )
}
