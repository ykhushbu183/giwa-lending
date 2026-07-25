import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { giwaSepolia } from "viem/chains";

const GIWA_CHAIN = 91342;
const TOKEN = "0xCcB10752990A7508933d2fF509e011f71032073F";
const POOL = "0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA";

const T_ABI = [
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
];

const P_ABI = [
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "deposit", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "borrow", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "repay", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "totalDeposits", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalBorrows", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getUserInfo", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getPoolStats", outputs: [{ internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }, { internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
];

const RPC = createPublicClient({ chain: giwaSepolia, transport: http() });

const GIWA = {
  chainId: "0x" + GIWA_CHAIN.toString(16),
  chainName: "GIWA Sepolia",
  rpcUrls: ["https://sepolia-rpc.giwa.io"],
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia-explorer.giwa.io"],
};

function fmt(v: string, d = 2) {
  const n = Number(v) / 1e18;
  if (n === 0) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: d });
}

function toB(v: string) {
  const c = v.replace(/,/g, "");
  if (!c || isNaN(Number(c))) return BigInt(0);
  return BigInt(Math.floor(Number(c) * 1e18));
}

type View = "dashboard" | "market";

function detectWallets() {
  type W = { id: string; name: string; icon: string; provider: any };
  const list: W[] = [];
  const push = (id: string, name: string, icon: string, p: any) => {
    if (p && !list.find(x => x.id === id)) list.push({ id, name, icon, provider: p });
  };
  if ((window as any).ethereum?.providers?.length) {
    (window as any).ethereum.providers.forEach((p: any) => {
      if (p.isMetaMask) push("metamask", "MetaMask", "🦊", p);
      else if (p.isCoinbaseWallet) push("coinbase", "Coinbase", "🔵", p);
      else push("eip", "EIP-1193", "💼", p);
    });
  } else if ((window as any).ethereum) {
    push("metamask", "MetaMask", "🦊", (window as any).ethereum);
  }
  if ((window as any).okxwallet) push("okx", "OKX Wallet", "🟠", (window as any).okxwallet);
  if ((window as any).trustwallet) push("trust", "Trust Wallet", "💙", (window as any).trustwallet);
  if ((window as any).bitkeep) push("bitget", "Bitget Wallet", "🟣", (window as any).bitkeep);
  if ((window as any).coinbaseWalletExtension) push("coinbase", "Coinbase", "🔵", (window as any).coinbaseWalletExtension);
  return list;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("glt") || "dark");
  const [view, setView] = useState<View>("market");
  const [acct, setAcct] = useState("");
  const [chain, setChain] = useState(0);
  const [sym, setSym] = useState("GLT");
  const [bal, setBal] = useState("0");
  const [allow, setAllow] = useState("0");
  const [tDep, setTDep] = useState("0");
  const [tBor, setTBor] = useState("0");
  const [util, setUtil] = useState("0");
  const [uDep, setUDep] = useState("0");
  const [uBor, setUBor] = useState("0");
  const [uCol, setUCol] = useState("0");
  const [lInt, setLInt] = useState("0");
  const [bInt, setBInt] = useState("0");
  const [mode, setMode] = useState<"supply" | "withdraw" | "borrow" | "repay">("supply");
  const [amt, setAmt] = useState("");
  const [mint, setMint] = useState("100");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  const dk = theme === "dark";
  const ok = chain === GIWA_CHAIN;
  const wallets = detectWallets();

  useEffect(() => { localStorage.setItem("glt", theme); }, [theme]);
  useEffect(() => {
    if (!(window as any).ethereum) return;
    const h = (id: string) => { setChain(Number(id)); };
    (window as any).ethereum.on("chainChanged", h);
    return () => (window as any).ethereum?.removeListener("chainChanged", h);
  }, []);

  async function connectWallet(prov: any) {
    try {
      const [a] = await prov.request({ method: "eth_requestAccounts" });
      const c = await prov.request({ method: "eth_chainId" });
      setProvider(prov);
      setAcct(a); setChain(Number(c));
      setShowPicker(false);
      if (Number(c) === GIWA_CHAIN) await load(a);
    } catch { setMsg("Rejected"); setShowPicker(false); }
  }

  async function switchNet() {
    try {
      await (provider || (window as any).ethereum)!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GIWA.chainId }] });
    } catch (e: any) {
      if (e.code === 4902) {
        try { await (provider || (window as any).ethereum)!.request({ method: "wallet_addEthereumChain", params: [GIWA] }); }
        catch { setMsg("Cancelled"); }
      }
    }
  }

  async function load(a: string) {
    try {
      const [s, b, al] = await Promise.all([
        RPC.readContract({ address: TOKEN, abi: T_ABI, functionName: "symbol" }) as Promise<string>,
        RPC.readContract({ address: TOKEN, abi: T_ABI, functionName: "balanceOf", args: [a] }) as Promise<bigint>,
        RPC.readContract({ address: TOKEN, abi: T_ABI, functionName: "allowance", args: [a, POOL] }) as Promise<bigint>,
      ]);
      setSym(s); setBal(b.toString()); setAllow(al.toString());
      const [d, br] = await Promise.all([
        RPC.readContract({ address: POOL, abi: P_ABI, functionName: "totalDeposits" }) as Promise<bigint>,
        RPC.readContract({ address: POOL, abi: P_ABI, functionName: "totalBorrows" }) as Promise<bigint>,
      ]);
      setTDep(d.toString()); setTBor(br.toString());
      setUtil(d === BigInt(0) ? "0" : Number(br * BigInt(100) / d).toString());
      const inf = await RPC.readContract({ address: POOL, abi: P_ABI, functionName: "getUserInfo", args: [a] }) as bigint[];
      setUDep(inf[0].toString()); setUBor(inf[1].toString()); setUCol(inf[2].toString());
      setLInt(inf[3].toString()); setBInt(inf[4].toString());
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (acct && ok) { load(acct); const i = setInterval(() => load(acct), 8000); return () => clearInterval(i); }
  }, [acct, ok]);

  async function send(fn: () => Promise<void>) {
    if (!ok) return setMsg("Wrong network");
    setMsg(""); setBusy("");
    try { await fn(); } catch (e: any) {
      const m = e?.shortMessage || e?.message || "Failed";
      setMsg(m.includes("denied") || m.includes("rejected") ? "❌ Cancelled" : "❌ Failed");
    }
    setBusy("");
    if (acct && ok) await load(acct);
  }

  async function w(fn: string, args: any[]) {
    const { createWalletClient, custom } = await import("viem");
    const p = provider || (window as any).ethereum;
    const wallet = createWalletClient({ account: acct as any, chain: giwaSepolia, transport: custom(p) });
    const addr = fn === "mint" ? TOKEN : POOL;
    const abi = fn === "mint" || fn === "approve" ? T_ABI : P_ABI;
    await wallet.writeContract({ address: addr, abi, functionName: fn, args });
    setMsg(`✅ ${fn} done!`);
  }

  const hf = () => {
    const d = Number(uDep); const b = Number(uBor);
    if (d === 0 || b === 0) return { pct: 100, c: "#22c55e", l: "Safe", bg: "rgba(34,197,94,0.1)" };
    const r = Math.min((d * 100) / (b * 1.5), 100);
    return { pct: Math.round(r), c: r > 80 ? "#22c55e" : r > 50 ? "#eab308" : "#ef4444", l: r > 80 ? "Safe" : r > 50 ? "Moderate" : "Risk", bg: r > 80 ? "rgba(34,197,94,0.1)" : r > 50 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)" };
  };

  const health = hf();

  const C = {
    bg: dk ? "#0b0b14" : "#f5f6fa",
    s: dk ? "#12121d" : "#ffffff",
    b: dk ? "rgba(99,102,241,0.12)" : "rgba(0,0,0,0.07)",
    t: dk ? "#e8eaed" : "#1a1d23",
    m: dk ? "#6b7280" : "#6b7280",
    ib: dk ? "#0a0a14" : "#eef0f5",
  };

  const n = {
    outer: { background: C.bg, color: C.t, fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh", position: "relative" as const },
    nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60, borderBottom: `1px solid ${C.b}`, background: C.s },
    logo: { fontSize: 17, fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties,
    tab: (a: boolean) => ({ padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", background: a ? (dk ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)") : "transparent", color: a ? "#818cf8" : C.m }),
    btn: (c: string) => ({ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff", background: c }),
    card: { background: C.s, borderRadius: 12, border: `1px solid ${C.b}`, overflow: "hidden" },
    ch: { padding: "14px 18px", borderBottom: `1px solid ${C.b}`, display: "flex", justifyContent: "space-between", alignItems: "center" },
    cb: { padding: 18 },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" },
    lb: { fontSize: 13, color: C.m },
    vl: { fontSize: 14, fontWeight: 600 },
    inp: { width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 15, border: `1px solid ${dk ? "#2a2a3a" : "#d0d4e0"}`, background: C.ib, color: C.t, outline: "none", boxSizing: "border-box" as React.CSSProperties["boxSizing"] },
    act: (a: boolean, c: string) => ({ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: a ? C.s : "transparent", color: a ? c : C.m, boxShadow: a ? `0 1px 4px ${dk ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)"}` : "none" }),
    g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
    stat: { padding: "12px 8px", textAlign: "center" as const, borderRadius: 10, background: dk ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)" },
    tag: (bg: string, c: string) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: bg, color: c }),
    modal: {
      overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
      box: { background: C.s, borderRadius: 16, padding: 24, width: 320, maxWidth: "90vw", border: `1px solid ${C.b}`, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" },
      title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
      sub: { fontSize: 13, color: C.m, marginBottom: 20 },
      item: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${C.b}`, marginBottom: 8, transition: "all 0.15s", background: "transparent" as const, width: "100%", color: C.t, fontSize: 14, fontWeight: 600 },
    },
  };

  const needApprove = acct && Number(allow) < Number(toB(amt || "0"));

  return (
    <div style={n.outer}>
      <div style={n.nav}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={n.logo}>🏦 GiwaLend</span>
          <button style={n.tab(view === "market")} onClick={() => setView("market")}>Market</button>
          <button style={n.tab(view === "dashboard")} onClick={() => setView("dashboard")}>Dashboard</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {acct && <span style={n.tag(dk ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", "#818cf8")}>{acct.slice(0, 5)}...{acct.slice(-3)}</span>}
          <button style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.b}`, background: "transparent", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setTheme(dk ? "light" : "dark")}>{dk ? "☀️" : "🌙"}</button>
          {!acct ? (
            <button style={n.btn("linear-gradient(135deg, #6366f1, #8b5cf6)")} onClick={() => { if (wallets.length > 1) setShowPicker(true); else if (wallets.length === 1) connectWallet(wallets[0].provider); else setMsg("No wallet found"); }}>Connect</button>
          ) : !ok ? (
            <button style={n.btn("linear-gradient(135deg, #eab308, #d97706)")} onClick={switchNet}>Switch Network</button>
          ) : <span style={n.tag("rgba(34,197,94,0.15)", "#22c55e")}>🟢 GIWA</span>}
        </div>
      </div>

      {showPicker && (
        <div style={n.modal.overlay} onClick={() => setShowPicker(false)}>
          <div style={n.modal.box} onClick={e => e.stopPropagation()}>
            <div style={n.modal.title}>Connect Wallet</div>
            <div style={n.modal.sub}>Choose a wallet to connect</div>
            {wallets.map(w => (
              <button key={w.id} style={n.modal.item}
                onClick={() => connectWallet(w.provider)}
                onMouseEnter={e => (e.currentTarget.style.background = dk ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: 24 }}>{w.icon}</span>
                <span>{w.name}</span>
              </button>
            ))}
            <button style={{ ...n.modal.item, justifyContent: "center", color: C.m, fontSize: 13, marginTop: 4 }}
              onClick={() => setShowPicker(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        {!acct && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏦</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>GiwaLend</h1>
            <p style={{ color: C.m, marginBottom: 24, fontSize: 14 }}>Lend & borrow GLT on GIWA Sepolia testnet</p>
            <button style={{ ...n.btn("linear-gradient(135deg, #6366f1, #8b5cf6)"), padding: "12px 32px", fontSize: 15 }}
              onClick={() => { if (wallets.length > 1) setShowPicker(true); else if (wallets.length === 1) connectWallet(wallets[0].provider); else setMsg("No wallet found"); }}>
              Connect Wallet
            </button>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 24, fontSize: 13, color: C.m }}>
              <span>1. Connect Wallet</span><span>→</span><span>2. Get GLT</span><span>→</span><span>3. Supply & Earn</span><span>→</span><span>4. Borrow</span>
            </div>
          </div>
        )}

        {acct && !ok && (
          <div style={{ ...n.card, textAlign: "center", padding: 24, marginBottom: 16, border: "1px solid #eab308" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "#eab308" }}>Wrong Network</div>
            <div style={{ fontSize: 13, color: C.m, marginBottom: 12 }}>Switch to GIWA Sepolia (Chain ID: 91342)</div>
            <button style={n.btn("linear-gradient(135deg, #eab308, #d97706)")} onClick={switchNet}>Add / Switch GIWA Sepolia</button>
          </div>
        )}

        {acct && ok && view === "market" && (
          <>
            <div style={n.card}>
              <div style={n.ch}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>🪙</span>
                  <div><div style={{ fontWeight: 700, fontSize: 14 }}>{sym}</div><div style={{ fontSize: 11, color: C.m }}>GIWA Sepolia</div></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.m }}>Wallet</div>
                  <div style={{ fontWeight: 600 }}>{fmt(bal, 2)} {sym}</div>
                </div>
              </div>
              <div style={n.cb}>
                <div style={n.g3}>
                  <div style={n.stat}><div style={{ fontSize: 11, color: C.m }}>Supply APY</div><div style={{ fontSize: 17, fontWeight: 700, color: "#22c55e" }}>5%</div></div>
                  <div style={n.stat}><div style={{ fontSize: 11, color: C.m }}>Borrow APR</div><div style={{ fontSize: 17, fontWeight: 700, color: "#eab308" }}>10%</div></div>
                  <div style={n.stat}><div style={{ fontSize: 11, color: C.m }}>Utilization</div><div style={{ fontSize: 17, fontWeight: 700 }}>{util}%</div></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: "center", padding: 8, background: dk ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: C.m }}>Total Supplied</div><div style={{ fontWeight: 600, color: "#22c55e" }}>{fmt(tDep, 2)}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 8, background: dk ? "rgba(234,179,8,0.06)" : "rgba(234,179,8,0.04)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: C.m }}>Total Borrowed</div><div style={{ fontWeight: 600, color: "#eab308" }}>{fmt(tBor, 2)}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 4, marginBottom: 16, background: dk ? "rgba(10,10,20,0.5)" : "#eef0f5", padding: 4, borderRadius: 10 }}>
                  {(["supply", "withdraw", "borrow", "repay"] as const).map(m => (
                    <button key={m} style={n.act(mode === m, m === "supply" || m === "repay" ? "#22c55e" : "#eab308")} onClick={() => { setMode(m); setAmt(""); }}>{m}</button>
                  ))}
                </div>

                <div style={{ fontSize: 12, color: C.m, marginBottom: 8 }}>
                  {mode === "supply" && `Supply ${sym} to earn 5% APY`}
                  {mode === "withdraw" && `Withdraw ${sym} (Supplied: ${fmt(uDep, 2)})`}
                  {mode === "borrow" && `Borrow ${sym} at 10% APR (Max: ${fmt(uCol, 2)})`}
                  {mode === "repay" && `Repay ${sym} (Borrowed: ${fmt(uBor, 2)})`}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00" style={n.inp} />
                  <button style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${dk ? "#2a2a3a" : "#d0d4e0"}`, fontSize: 12, fontWeight: 600, cursor: "pointer", background: C.ib, color: C.m, whiteSpace: "nowrap" }}
                    onClick={() => { const v = mode === "supply" ? bal : mode === "withdraw" ? uDep : mode === "borrow" ? uCol : uBor; setAmt(fmt(v, 6)); }}>MAX</button>
                </div>

                <div style={{ marginTop: 12 }}>
                  {mode === "supply" && needApprove && <button style={{ ...n.btn("linear-gradient(135deg, #eab308, #d97706)"), width: "100%" }}
                    onClick={() => send(() => w("approve", [POOL, BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")]))}>1️⃣ Approve Pool</button>}
                  {mode === "supply" && !needApprove && <button style={{ ...n.btn("linear-gradient(135deg, #22c55e, #16a34a)"), width: "100%" }}
                    onClick={() => send(() => w("deposit", [toB(amt)]))}>2️⃣ Supply {sym}</button>}
                  {mode === "withdraw" && <button style={{ ...n.btn("linear-gradient(135deg, #eab308, #d97706)"), width: "100%" }}
                    onClick={() => send(() => w("withdraw", [toB(amt)]))}>Withdraw {sym}</button>}
                  {mode === "borrow" && <button style={{ ...n.btn("linear-gradient(135deg, #eab308, #d97706)"), width: "100%" }}
                    onClick={() => send(() => w("borrow", [toB(amt)]))}>Borrow {sym}</button>}
                  {mode === "repay" && <button style={{ ...n.btn("linear-gradient(135deg, #22c55e, #16a34a)"), width: "100%" }}
                    onClick={() => send(() => w("repay", [toB(amt)]))}>Repay {sym}</button>}
                </div>

                {busy && <div style={{ textAlign: "center", color: "#eab308", fontWeight: 600, fontSize: 13, marginTop: 8 }}>⏳ {busy}...</div>}
                {msg && <div style={{ textAlign: "center", padding: "6px 0", fontSize: 12, marginTop: 8, color: msg.includes("❌") ? "#ef4444" : "#22c55e" }}>{msg}</div>}
              </div>
            </div>

            <div style={{ ...n.card, marginTop: 16 }}>
              <div style={n.ch}><span style={{ fontWeight: 600, fontSize: 14 }}>Get Tokens</span></div>
              <div style={{ ...n.cb, display: "flex", gap: 8, alignItems: "center" }}>
                <input value={mint} onChange={e => setMint(e.target.value)} style={{ ...n.inp, width: 100, textAlign: "center" }} />
                <button style={n.btn("linear-gradient(135deg, #6366f1, #8b5cf6)")} onClick={() => send(() => w("mint", [toB(mint)]))}>Mint {sym}</button>
                {needApprove && <span style={{ fontSize: 11, color: C.m }}>First mint, then approve ↓</span>}
              </div>
            </div>

            <div style={{ ...n.card, marginTop: 16 }}>
              <div style={n.ch}><span style={{ fontWeight: 600, fontSize: 14 }}>Your Position</span><span style={n.tag(health.bg, health.c)}>{health.l}</span></div>
              <div style={n.cb}>
                <div style={n.row}><span style={n.lb}>Supplied</span><span style={n.vl}>{fmt(uDep, 4)} {sym}</span></div>
                <div style={n.row}><span style={n.lb}>Interest Earned</span><span style={{ ...n.vl, color: "#22c55e" }}>+{fmt(lInt, 4)} {sym}</span></div>
                <div style={n.row}><span style={n.lb}>Borrowed</span><span style={n.vl}>{fmt(uBor, 4)} {sym}</span></div>
                <div style={n.row}><span style={n.lb}>Interest Owing</span><span style={{ ...n.vl, color: "#ef4444" }}>-{fmt(bInt, 4)} {sym}</span></div>
                <div style={n.row}><span style={n.lb}>Collateral</span><span style={n.vl}>{fmt(uCol, 4)} {sym}</span></div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: C.m }}>Health Factor</span><span style={{ color: health.c, fontWeight: 600 }}>{health.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: dk ? "#1a1a2e" : "#e0e4ec", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${health.pct}%`, background: health.c, transition: "width 0.5s" }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {acct && ok && view === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={n.card}><div style={n.cb}>
                <div style={{ fontSize: 11, color: C.m, marginBottom: 4 }}>Net Worth</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(uDep, 2)} {sym}</div>
                <div style={{ fontSize: 11, color: "#22c55e" }}>+{fmt(lInt, 4)} earned</div>
              </div></div>
              <div style={n.card}><div style={n.cb}>
                <div style={{ fontSize: 11, color: C.m, marginBottom: 4 }}>Borrow Balance</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{fmt(uBor, 2)} {sym}</div>
                <div style={{ fontSize: 11, color: "#ef4444" }}>-{fmt(bInt, 4)} owing</div>
              </div></div>
              <div style={n.card}><div style={n.cb}>
                <div style={{ fontSize: 11, color: C.m, marginBottom: 4 }}>Health Factor</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: health.c }}>{health.l}</div>
                <div style={{ fontSize: 11, color: C.m }}>{health.pct}% · 150% collat.</div>
              </div></div>
            </div>

            <div style={n.card}>
              <div style={n.ch}><span style={{ fontWeight: 600, fontSize: 14 }}>Supplies</span></div>
              <div style={n.cb}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>🪙</span>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{sym}</div><div style={{ fontSize: 11, color: C.m }}>{fmt(uDep, 2)} supplied</div></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#22c55e", fontSize: 13 }}>{fmt(lInt, 4)}</div>
                    <div style={{ fontSize: 11, color: C.m }}>earned</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={n.card}>
              <div style={n.ch}><span style={{ fontWeight: 600, fontSize: 14 }}>Borrows</span></div>
              <div style={n.cb}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>🪙</span>
                    <div><div style={{ fontWeight: 600, fontSize: 13 }}>{sym}</div><div style={{ fontSize: 11, color: C.m }}>{fmt(uBor, 2)} borrowed</div></div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600, color: "#eab308", fontSize: 13 }}>{fmt(bInt, 4)}</div>
                    <div style={{ fontSize: 11, color: C.m }}>owing</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={n.card}>
              <div style={n.ch}><span style={{ fontWeight: 600, fontSize: 14 }}>Pool Stats</span></div>
              <div style={n.cb}>
                <div style={n.row}><span style={n.lb}>Total Supplied</span><span style={{ ...n.vl, color: "#22c55e" }}>{fmt(tDep, 2)}</span></div>
                <div style={n.row}><span style={n.lb}>Total Borrowed</span><span style={{ ...n.vl, color: "#eab308" }}>{fmt(tBor, 2)}</span></div>
                <div style={n.row}><span style={n.lb}>Utilization Rate</span><span style={n.vl}>{util}%</span></div>
                <div style={n.row}><span style={n.lb}>Collateral Ratio</span><span style={n.vl}>150%</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
