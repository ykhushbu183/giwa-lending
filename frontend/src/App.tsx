import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { giwaSepolia } from "viem/chains";

const GIWA = 91342;
const TOKEN = "0xCcB10752990A7508933d2fF509e011f71032073F";
const POOL = "0x4C62dDcDe751f39Bc0661fCaA9Dc0C7d68dE0eCA";

const T = [
  { inputs: [{ internalType: "address", name: "", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "spender", type: "address" }, { internalType: "uint256", name: "amount", type: "uint256" }], name: "approve", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "", type: "address" }, { internalType: "address", name: "", type: "address" }], name: "allowance", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ internalType: "string", name: "", type: "string" }], stateMutability: "view", type: "function" },
];

const P = [
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

const GIWA_NET = {
  chainId: "0x" + GIWA.toString(16),
  chainName: "GIWA Sepolia",
  rpcUrls: ["https://sepolia-rpc.giwa.io"],
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://sepolia-explorer.giwa.io"],
};

function fmt(v: string, d = 2) {
  const n = Number(v) / 1e18;
  if (n === 0) return "0";
  if (n < 0.01) return "<0.01";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: d });
}

function toB(v: string) {
  const c = v.replace(/,/g, "");
  if (!c || isNaN(Number(c))) return BigInt(0);
  return BigInt(Math.floor(Number(c) * 1e18));
}

type Tab = "market" | "dashboard";
type Act = "supply" | "withdraw" | "borrow" | "repay";

function wallets() {
  type W = { id: string; n: string; i: string; p: any };
  const a: W[] = [];
  const p = (id: string, n: string, i: string, pv: any) => { if (pv && !a.find(x => x.id === id)) a.push({ id, n, i, p: pv }); };
  const e = (window as any).ethereum;
  if (e?.providers?.length) {
    e.providers.forEach((p: any) => {
      if (p.isMetaMask) p("metamask", "MetaMask", "🦊", p);
      else if (p.isCoinbaseWallet) p("coinbase", "Coinbase", "🔵", p);
      else p("eip", "EIP-1193", "💼", p);
    });
  } else if (e) p("metamask", "MetaMask", "🦊", e);
  p("okx", "OKX Wallet", "🟠", (window as any).okxwallet);
  p("trust", "Trust Wallet", "💙", (window as any).trustwallet);
  p("bitget", "Bitget Wallet", "🟣", (window as any).bitkeep);
  p("coinbase", "Coinbase", "🔵", (window as any).coinbaseWalletExtension);
  return a;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("gl") || "dark");
  const [tab, setTab] = useState<Tab>("market");
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
  const [mode, setMode] = useState<Act>("supply");
  const [amt, setAmt] = useState("");
  const [mint, setMint] = useState("100");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [picker, setPicker] = useState(false);

  const dk = theme === "dark";
  const ok = chain === GIWA;
  const w = wallets();
  const is = dk ? "dark" : "light";

  useEffect(() => { localStorage.setItem("gl", theme); document.documentElement.setAttribute("data-theme", is); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", is); }, []);

  useEffect(() => {
    if (!(window as any).ethereum) return;
    const h = (id: string) => setChain(Number(id));
    (window as any).ethereum.on("chainChanged", h);
    return () => (window as any).ethereum?.removeListener("chainChanged", h);
  }, []);

  async function connect(prov: any) {
    try {
      const [a] = await prov.request({ method: "eth_requestAccounts" });
      const c = await prov.request({ method: "eth_chainId" });
      setAcct(a); setChain(Number(c)); setPicker(false);
      if (Number(c) === GIWA) await load(a);
    } catch { setMsg("Rejected"); setPicker(false); }
  }

  async function switchNet() {
    try {
      await ((window as any).ethereum)!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GIWA_NET.chainId }] });
    } catch (e: any) {
      if (e.code === 4902) {
        try { await ((window as any).ethereum)!.request({ method: "wallet_addEthereumChain", params: [GIWA_NET] }); }
        catch { setMsg("Cancelled"); }
      }
    }
  }

  async function load(a: string) {
    try {
      const [s, b, al] = await Promise.all([
        RPC.readContract({ address: TOKEN, abi: T, functionName: "symbol" }) as Promise<string>,
        RPC.readContract({ address: TOKEN, abi: T, functionName: "balanceOf", args: [a] }) as Promise<bigint>,
        RPC.readContract({ address: TOKEN, abi: T, functionName: "allowance", args: [a, POOL] }) as Promise<bigint>,
      ]);
      setSym(s); setBal(b.toString()); setAllow(al.toString());
      const [d, br] = await Promise.all([
        RPC.readContract({ address: POOL, abi: P, functionName: "totalDeposits" }) as Promise<bigint>,
        RPC.readContract({ address: POOL, abi: P, functionName: "totalBorrows" }) as Promise<bigint>,
      ]);
      setTDep(d.toString()); setTBor(br.toString());
      setUtil(d === BigInt(0) ? "0" : Number(br * BigInt(100) / d).toString());
      const inf = await RPC.readContract({ address: POOL, abi: P, functionName: "getUserInfo", args: [a] }) as bigint[];
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
      const m = e?.shortMessage || e?.message || "";
      setMsg(m.includes("denied") || m.includes("rejected") ? "❌ Cancelled" : "❌ Failed");
    }
    setBusy("");
    if (acct && ok) await load(acct);
  }

  async function wc(fn: string, args: any[]) {
    const { createWalletClient, custom } = await import("viem");
    const wallet = createWalletClient({ account: acct as any, chain: giwaSepolia, transport: custom((window as any).ethereum) });
    const addr = fn === "mint" ? TOKEN : POOL;
    const abi = fn === "mint" || fn === "approve" ? T : P;
    await wallet.writeContract({ address: addr, abi, functionName: fn, args });
    setMsg(`✅ ${fn} done`);
  }

  const hf = () => {
    const d = Number(uDep); const b = Number(uBor);
    if (d === 0 || b === 0) return { p: 100, c: "#10b981", l: "Safe" };
    const r = Math.min((d * 100) / (b * 1.5), 100);
    return { p: Math.round(r), c: r > 80 ? "#10b981" : r > 50 ? "#f59e0b" : "#ef4444", l: r > 80 ? "Safe" : r > 50 ? "Fair" : "Risk" };
  };

  const h = hf();

  const na = acct && Number(allow) < Number(toB(amt || "0"));

  return (
    <>
      <style>{`
        :root{--bg:#000;--grid:rgba(255,255,255,0.015);--card:#0a0a0a;--card-hover:#141414;--input:#0a0a0a;--border:rgba(255,255,255,0.08);--border-hover:rgba(255,255,255,0.18);--text:#fff;--text2:#a3a3a3;--text3:#737373;--accent:#fff;--accent-green:#10b981;--accent-yellow:#f59e0b;--accent-red:#ef4444;--accent-purple:#8b5cf6}
        [data-theme="light"]{--bg:#f5f5f5;--grid:rgba(0,0,0,0.02);--card:#fff;--card-hover:#f0f0f0;--input:#f5f5f5;--border:rgba(0,0,0,0.08);--border-hover:rgba(0,0,0,0.15);--text:#000;--text2:#525252;--text3:#8a8a8a;--accent:#000}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:48px 48px;background-position:50%;-webkit-font-smoothing:antialiased}
        input{background:var(--input);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px 14px;font-size:14px;outline:none;transition:border .18s;width:100%}
        input:focus{border-color:var(--accent)}input::placeholder{color:var(--text3)}
        button{cursor:pointer;font-family:inherit}
        .card{background:var(--card);border:1px solid var(--border);border-radius:12px;transition:all .18s}
        .card:hover{border-color:var(--border-hover)}
      `}</style>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60, borderBottom: "1px solid var(--border)",
        background: dk ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>🏦 <span style={{ color: "var(--accent)" }}>GiwaLend</span></span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["market", "dashboard"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: tab === t ? 600 : 400,
                  background: tab === t ? "var(--border)" : "transparent", color: tab === t ? "var(--text)" : "var(--text2)",
                  transition: "all .15s",
                }}>{t === "market" ? "Market" : "Dashboard"}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {acct && <span style={{ fontSize: 12, color: "var(--text2)", fontFamily: "monospace" }}>{acct.slice(0, 5)}...{acct.slice(-3)}</span>}
          <button onClick={() => setTheme(dk ? "light" : "dark")}
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dk ? "☀️" : "🌙"}
          </button>
          {!acct ? (
            <button onClick={() => w.length > 1 ? setPicker(true) : w.length === 1 ? connect(w[0].p) : setMsg("No wallet")}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent)", color: dk ? "#000" : "#fff" }}>
              Connect Wallet
            </button>
          ) : !ok ? (
            <button onClick={switchNet}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
              Switch Network
            </button>
          ) : (
            <span style={{ fontSize: 12, color: "var(--accent-green)", fontWeight: 500 }}>● GIWA</span>
          )}
        </div>
      </div>

      {picker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={() => setPicker(false)}>
          <div className="card" style={{ padding: 24, width: 300 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Connect Wallet</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Choose a wallet to connect</div>
            {w.map(x => (
              <button key={x.id} onClick={() => connect(x.p)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: 13, fontWeight: 500, marginBottom: 6, transition: "all .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: 22 }}>{x.i}</span> {x.n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
        {!acct && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>GiwaLend</h1>
            <p style={{ color: "var(--text2)", marginBottom: 24, fontSize: 14 }}>Lend & borrow GLT on GIWA Sepolia</p>
            <button onClick={() => w.length > 1 ? setPicker(true) : w.length === 1 ? connect(w[0].p) : setMsg("No wallet")}
              style={{ padding: "12px 28px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, background: "var(--accent)", color: dk ? "#000" : "#fff" }}>
              Connect Wallet
            </button>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 20, fontSize: 12, color: "var(--text2)" }}>
              <span>1. Connect</span><span style={{ color: "var(--text3)" }}>→</span><span>2. Mint GLT</span><span style={{ color: "var(--text3)" }}>→</span><span>3. Supply</span><span style={{ color: "var(--text3)" }}>→</span><span>4. Borrow</span>
            </div>
          </div>
        )}

        {acct && !ok && (
          <div className="card" style={{ padding: 24, textAlign: "center", borderColor: "var(--accent-yellow)" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--accent-yellow)" }}>Wrong Network</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>Switch to GIWA Sepolia (Chain ID: 91342)</div>
            <button onClick={switchNet} style={{ padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
              Add / Switch GIWA Sepolia
            </button>
          </div>
        )}

        {acct && ok && tab === "market" && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🪙</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sym}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "monospace" }}>GIWA Sepolia</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>Balance</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{fmt(bal, 2)}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 16 }}>
                {[
                  { l: "Supply APY", v: "5%", c: "var(--accent-green)" },
                  { l: "Borrow APR", v: "10%", c: "var(--accent-yellow)" },
                  { l: "Utilization", v: `${util}%`, c: "var(--text)" },
                ].map(x => (
                  <div key={x.l} style={{ textAlign: "center", padding: "8px 0" }}>
                    <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "monospace" }}>{x.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 4, background: dk ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", padding: 3, borderRadius: 8 }}>
                  {(["supply", "withdraw", "borrow", "repay"] as const).map(m => (
                    <button key={m} onClick={() => { setMode(m); setAmt(""); }}
                      style={{
                        flex: 1, padding: "6px 0", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500,
                        background: mode === m ? "var(--card)" : "transparent",
                        color: mode === m ? (m === "supply" || m === "repay" ? "var(--accent-green)" : "var(--accent-yellow)") : "var(--text2)",
                        boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
                        transition: "all .15s",
                      }}>
                      {m === "supply" ? "Supply" : m === "withdraw" ? "Withdraw" : m === "borrow" ? "Borrow" : "Repay"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10 }}>
                  {mode === "supply" && <>Supply <strong>{sym}</strong> to earn <strong style={{ color: "var(--accent-green)" }}>5% APY</strong></>}
                  {mode === "withdraw" && <>Withdraw <strong>{sym}</strong> · Supplied: <strong>{fmt(uDep, 2)}</strong></>}
                  {mode === "borrow" && <>Borrow <strong>{sym}</strong> at <strong style={{ color: "var(--accent-yellow)" }}>10% APR</strong> · Max: <strong>{fmt(uCol, 2)}</strong></>}
                  {mode === "repay" && <>Repay <strong>{sym}</strong> · Borrowed: <strong>{fmt(uBor, 2)}</strong></>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00" />
                  <button onClick={() => { const v = mode === "supply" ? bal : mode === "withdraw" ? uDep : mode === "borrow" ? uCol : uBor; setAmt(fmt(v, 6)); }}
                    style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    MAX
                  </button>
                </div>
                <div style={{ marginTop: 12 }}>
                  {mode === "supply" && na && (
                    <button onClick={() => send(() => wc("approve", [POOL, BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")]))}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
                      Approve Pool
                    </button>
                  )}
                  {mode === "supply" && !na && (
                    <button onClick={() => send(() => wc("deposit", [toB(amt)]))}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-green)", color: "#000" }}>
                      Supply {sym}
                    </button>
                  )}
                  {mode === "withdraw" && (
                    <button onClick={() => send(() => wc("withdraw", [toB(amt)]))}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
                      Withdraw {sym}
                    </button>
                  )}
                  {mode === "borrow" && (
                    <button onClick={() => send(() => wc("borrow", [toB(amt)]))}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-yellow)", color: "#000" }}>
                      Borrow {sym}
                    </button>
                  )}
                  {mode === "repay" && (
                    <button onClick={() => send(() => wc("repay", [toB(amt)]))}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent-green)", color: "#000" }}>
                      Repay {sym}
                    </button>
                  )}
                </div>
                {busy && <div style={{ textAlign: "center", color: "var(--accent-yellow)", fontSize: 12, marginTop: 8 }}>⏳ {busy}...</div>}
                {msg && <div style={{ textAlign: "center", fontSize: 12, marginTop: 8, color: msg.includes("❌") ? "var(--accent-red)" : "var(--accent-green)" }}>{msg}</div>}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Get Tokens</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text3)", letterSpacing: "0.05em" }}>STEP 1</span>
              </div>
              <div style={{ padding: "14px 18px", display: "flex", gap: 8, alignItems: "center" }}>
                <input value={mint} onChange={e => setMint(e.target.value)} style={{ width: 100, textAlign: "center" }} />
                <button onClick={() => send(() => wc("mint", [toB(mint)]))}
                  style={{ padding: "10px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600, background: "var(--accent)", color: dk ? "#000" : "#fff", whiteSpace: "nowrap" }}>
                  Mint {sym}
                </button>
              </div>
            </div>

            <div className="card">
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Your Position</span>
                <span style={{ fontSize: 11, color: h.c, fontWeight: 500, fontFamily: "monospace" }}>{h.l}</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {[
                  { l: "Supplied", v: fmt(uDep, 4), c: "var(--text)" },
                  { l: "Interest Earned", v: `+${fmt(lInt, 4)}`, c: "var(--accent-green)" },
                  { l: "Borrowed", v: fmt(uBor, 4), c: "var(--text)" },
                  { l: "Interest Owing", v: `-${fmt(bInt, 4)}`, c: "var(--accent-red)" },
                  { l: "Collateral", v: fmt(uCol, 4), c: "var(--text)" },
                ].map(x => (
                  <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text2)" }}>{x.l}</span>
                    <span style={{ fontWeight: 600, color: x.c }}>{x.v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text2)" }}>Health Factor</span>
                    <span style={{ color: h.c, fontWeight: 600 }}>{h.p}%</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, width: `${h.p}%`, background: h.c, transition: "width .5s" }} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {acct && ok && tab === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { l: "Net Worth", v: fmt(uDep, 2), s: `+${fmt(lInt, 4)} earned`, sc: "var(--accent-green)" },
                { l: "Borrowed", v: fmt(uBor, 2), s: `-${fmt(bInt, 4)} owing`, sc: "var(--accent-red)" },
                { l: "Health", v: h.l, s: `${h.p}% · 150% collat.`, sc: "var(--text2)" },
              ].map(x => (
                <div key={x.l} className="card" style={{ padding: 16, textAlign: "center" as const }}>
                  <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontFamily: "monospace" }}>{x.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: x.l === "Health" ? h.c : "var(--text)" }}>{x.v}</div>
                  <div style={{ fontSize: 11, color: x.sc, marginTop: 2 }}>{x.s}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Supplies</span>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🪙</span>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{sym}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>{fmt(uDep, 2)} supplied</div></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: "var(--accent-green)", fontSize: 13 }}>{fmt(lInt, 4)}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>earned</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Borrows</span>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🪙</span>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{sym}</div><div style={{ fontSize: 11, color: "var(--text2)" }}>{fmt(uBor, 2)} borrowed</div></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, color: "var(--accent-yellow)", fontSize: 13 }}>{fmt(bInt, 4)}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>owing</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Pool Stats</span>
              </div>
              <div style={{ padding: "14px 18px" }}>
                {[
                  { l: "Total Supplied", v: fmt(tDep, 2), c: "var(--accent-green)" },
                  { l: "Total Borrowed", v: fmt(tBor, 2), c: "var(--accent-yellow)" },
                  { l: "Utilization", v: `${util}%` },
                  { l: "Collateral Ratio", v: "150%" },
                ].map(x => (
                  <div key={x.l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text2)" }}>{x.l}</span>
                    <span style={{ fontWeight: 600, color: x.c || "var(--text)" }}>{x.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
