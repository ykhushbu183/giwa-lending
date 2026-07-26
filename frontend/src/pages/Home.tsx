import { NavLink } from "react-router-dom"
import { useAccount } from "wagmi"
import TestnetNotice from "../components/TestnetNotice"

function HeroSection({ onConnect, isConnected }: { onConnect: () => void; isConnected: boolean }) {
  return (
    <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.08] blur-3xl" style={{ backgroundColor: "var(--text-primary)" }} />
        <div className="absolute -bottom-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-3xl" style={{ backgroundColor: "var(--text-primary)" }} />
      </div>
      <div className="relative">
        <div className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-none mb-6" style={{ color: "var(--text-primary)" }}>
          Lend & Borrow
          <br />
          <span style={{ color: "var(--text-accent)" }}>on GIWA Chain</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-10" style={{ color: "var(--text-muted)" }}>
          GiwaLend uses <strong>Dojang attestations</strong> to verify user identities on GIWA Chain.
          Only wallets with a valid Upbit Korea KYC attestation can supply GLT to earn 5% APY,
          borrow against collateral at 10% APR, and manage their position in real time.
        </p>
        <div className="flex items-center justify-center gap-4">
          {isConnected ? (
            <NavLink to="/market" className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold no-underline">
              Enter Market →
            </NavLink>
          ) : (
            <button onClick={onConnect} className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold">
              Connect Wallet
            </button>
          )}
          <a href="https://sepolia-explorer.giwa.io" target="_blank" rel="noopener noreferrer"
            className="btn-ghost px-8 py-3.5 rounded-xl text-base font-medium no-underline">
            View Explorer
          </a>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="eyebrow mb-7 justify-center" style={{ display: "flex" }}>About</div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-8" style={{ color: "var(--text-primary)" }}>
          What is GiwaLend?
        </h2>
        <div className="space-y-6 text-base leading-relaxed text-center" style={{ color: "var(--text-muted)" }}>
          <p className="text-lg">
            GiwaLend uses <strong className="font-medium" style={{ color: "var(--text-secondary)" }}>Dojang attestations</strong> for identity verification on GIWA Chain.
            Only wallets with a valid Upbit Korea KYC attestation can supply GLT tokens to earn interest, or borrow against their supplied collateral.
          </p>
          <p className="text-lg">
            Built for GASOK 2026, it&apos;s a fully functional lending market with real-time interest accrual,
            health factor monitoring, and a clean, minimal interface.
          </p>
          <p className="text-lg">
            The protocol uses a single-asset pool model — supply GLT, earn 5% APY.
            Borrow GLT at 10% APR with a 150% collateral ratio. Only Dojang-verified wallets can interact.
          </p>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { num: "01", title: "Connect & Verify", desc: "Link your wallet to GiwaLend. Only Dojang-verified wallets can access the protocol — unverified addresses are restricted." },
    { num: "02", title: "Mint GLT (Test Token)", desc: "GLT is a publicly mintable test ERC20 token — no faucet, no real value. Just enter an amount and mint directly in the app. It costs only GIWA Sepolia gas (~0 ETH)." },
    { num: "03", title: "Supply & Earn", desc: "Deposit GLT into the lending pool to start earning 5% APY. Your supplied amount becomes collateral." },
    { num: "04", title: "Borrow Against Collateral", desc: "Use up to 66% of your supplied value as collateral to borrow GLT at 10% APR." },
  ]
  return (
    <section className="py-20 md:py-24">
      <div className="eyebrow mb-7 justify-center" style={{ display: "flex" }}>Process</div>
      <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-14" style={{ color: "var(--text-primary)" }}>
        How It Works
      </h2>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {steps.map(s => (
          <div key={s.num} className="rounded-xl p-8 card" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
            <span className="numbered-step mb-4" style={{ display: "block" }}>
              <span className="num">{s.num}</span> · {s.title}
            </span>
            <p className="text-base leading-relaxed mt-3" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: "Supply",
      desc: "Deposit GLT into the pool and earn 5% APY. Your supply is used as collateral for borrowing. Dojang attestation required.",
      to: "/market",
      accent: "var(--accent-green)",
      bg: "var(--accent-green-soft)",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      title: "Borrow",
      desc: "Borrow GLT against your supplied collateral at 10% APR. Maintain a healthy >150% collateral ratio. Dojang attestation required.",
      to: "/market",
      accent: "var(--accent-yellow)",
      bg: "var(--accent-yellow-soft)",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      title: "Dashboard",
      desc: "Track your net worth, interest earned, borrowed position, and health factor in real time.",
      to: "/dashboard",
      accent: "var(--accent-purple)",
      bg: "var(--accent-purple-soft)",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      ),
    },
  ]
  return (
    <section className="py-20 md:py-24">
      <div className="eyebrow mb-7 justify-center" style={{ display: "flex" }}>Modules</div>
      <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
        Core Modules
      </h2>
      <p className="text-sm text-center max-w-md mx-auto mb-12" style={{ color: "var(--text-muted)" }}>
        Three powerful tools to manage your lending & borrowing
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(f => (
          <div key={f.title} className="rounded-xl p-8 card flex flex-col" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
            <div className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center" style={{ backgroundColor: f.bg, color: f.accent }}>
              {f.svg}
            </div>
            <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>{f.title}</h3>
            <p className="text-base leading-relaxed mb-6 flex-1" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            <NavLink to={f.to} className="inline-block text-center px-5 py-2.5 rounded-lg text-base font-medium transition-all no-underline"
              style={{ backgroundColor: f.bg, color: f.accent }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Go to {f.title}
            </NavLink>
          </div>
        ))}
      </div>
    </section>
  )
}

function BenefitsSection() {
  const items = [
    {
      title: "Dojang-Attested Access",
      desc: "Only wallets with a Dojang attestation from Upbit Korea KYC can lend and borrow. Unverified addresses are automatically blocked.",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
        </svg>
      ),
    },
    {
      title: "GIWA Chain Speed",
      desc: "1-second block times with Flashblocks preconfirmation for near-instant transactions.",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
    },
    {
      title: "Real-Time Interest",
      desc: "Interest accrues on every block. Track your earnings and borrow costs live on the dashboard.",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      title: "Fully Onchain",
      desc: "All deposits, borrows, and interest calculations happen onchain — transparent and verifiable.",
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
  ]
  return (
    <section className="py-20 md:py-24">
      <div className="eyebrow mb-7 justify-center" style={{ display: "flex" }}>Why</div>
      <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-14" style={{ color: "var(--text-primary)" }}>
        Why GiwaLend?
      </h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.title} className="rounded-xl p-8 card flex items-start gap-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--bg-accent-soft)", color: "var(--text-accent)" }}>
              {item.svg}
            </div>
            <div>
              <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{item.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CtaSection({ onConnect, isConnected }: { onConnect: () => void; isConnected: boolean }) {
  return (
    <section className="py-20 md:py-24 text-center">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: "var(--bg-accent-soft)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>
          Ready to get started?
        </h2>
        <p className="text-base mb-8 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
          Connect your Dojang-verified wallet to start lending and borrowing on GIWA Chain.
        </p>
        {isConnected ? (
          <NavLink to="/market" className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold no-underline">
            Enter Market →
          </NavLink>
        ) : (
          <button onClick={onConnect} className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold">
            Connect Wallet
          </button>
        )}
      </div>
    </section>
  )
}

function FooterSection() {
  return (
    <footer className="py-10 text-center border-t" style={{ borderColor: "var(--border-header)" }}>
      <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
        Built on <a href="https://giwa.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-accent)" }} className="hover:underline">GIWA Chain</a>
        &nbsp;·&nbsp;
        <a href="https://sepolia-explorer.giwa.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-accent)" }} className="hover:underline">Explorer</a>
      </p>
      <p className="text-[0.65rem]" style={{ color: "var(--text-dim)" }}>
        Dojang-attested lending protocol built for GASOK 2026. Not affiliated with GIWA or Upbit.
      </p>
    </footer>
  )
}

export default function Home({ onConnectRequest }: { onConnectRequest: () => void }) {
  const { isConnected } = useAccount()
  return (
    <>
      <div className="px-6 md:px-12 lg:px-20">
      <TestnetNotice />
      <HeroSection onConnect={onConnectRequest} isConnected={isConnected} />
      <AboutSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BenefitsSection />
      <CtaSection onConnect={onConnectRequest} isConnected={isConnected} />
      <FooterSection />
      </div>
    </>
  )
}
