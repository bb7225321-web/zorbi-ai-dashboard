import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard, ShoppingCart, PackagePlus, Boxes, BarChart3, Users as UsersIcon,
  Truck, Wallet, FileBarChart2, UserCog, Settings as SettingsIcon, Search, LogOut,
  KeyRound, Clock, ShieldCheck, ArrowUp, ArrowDown, CornerDownLeft, PackageSearch,
} from "lucide-react";
import { PosProvider, usePos } from "./store";
import { PrintPortal } from "./print";
import { Modal, Btn, Field, Inp, Tag, Empty } from "./ui";
import { ROLE_LABEL, Screen, Perm, fmtDate, todayISO, nowHM, fmtNum, stockOf } from "./core";
import { ZBLogoLockup, ZBMark, AboutModal } from "./logo";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Pos } from "./pages/Pos";
import { Purchases } from "./pages/Purchases";
import { Products } from "./pages/Products";
import { Inventory } from "./pages/Inventory";
import { Customers, Suppliers } from "./pages/Parties";
import { Accounts } from "./pages/Accounts";
import { Reports } from "./pages/Reports";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";

const NAV: { id: Screen; label: string; icon: React.ReactNode; perm: Perm; kbd?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-[18px]" />, perm: "receipts" },
  { id: "pos", label: "Point of Sale", icon: <ShoppingCart className="size-[18px]" />, perm: "pos", kbd: "F1" },
  { id: "purchases", label: "Purchases", icon: <PackagePlus className="size-[18px]" />, perm: "purchases", kbd: "F6" },
  { id: "products", label: "Products", icon: <Boxes className="size-[18px]" />, perm: "products" },
  { id: "inventory", label: "Inventory", icon: <BarChart3 className="size-[18px]" />, perm: "inventory", kbd: "F7" },
  { id: "customers", label: "Customers", icon: <UsersIcon className="size-[18px]" />, perm: "customers", kbd: "F4" },
  { id: "suppliers", label: "Suppliers", icon: <Truck className="size-[18px]" />, perm: "suppliers" },
  { id: "accounts", label: "Accounts", icon: <Wallet className="size-[18px]" />, perm: "accounts" },
  { id: "reports", label: "Reports", icon: <FileBarChart2 className="size-[18px]" />, perm: "reports" },
  { id: "users", label: "Users", icon: <UserCog className="size-[18px]" />, perm: "users" },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="size-[18px]" />, perm: "settings", kbd: "F12" },
];

function screenPerm(s: Screen): Perm {
  return NAV.find((n) => n.id === s)?.perm || "receipts";
}

export function PosApp() {
  return (
    <PosProvider>
      <Shell />
      <Toaster position="top-right" richColors />
    </PosProvider>
  );
}

function Shell() {
  const { user, screen, navTo } = usePos();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // F5 — refresh the current screen
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("zb:refresh", h);
    return () => window.removeEventListener("zb:refresh", h);
  }, []);

  if (!user) return <Login />;
  if (user.mustChange) return <ForcePassword />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <Sidebar onAbout={() => setAboutOpen(true)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onAbout={() => setAboutOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <ScreenView tick={tick} />
        </main>
      </div>
      <GlobalShortcuts />
      <SearchModal />
      <ConfirmModal />
      <AdminGateModal />
      <PrintPortal />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

function Sidebar({ onAbout }: { onAbout: () => void }) {
  const { db, user, screen, navTo, logout } = usePos();
  const nav = NAV.filter((n) => (user?.perms || []).includes(n.perm) || user?.role === "admin");
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <div className="flex items-center gap-3 px-4 py-4">
        <ZBLogoLockup size={38} onClick={onAbout} />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {nav.map((n) => (
          <button key={n.id} type="button" onClick={() => navTo(n.id)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
              screen === n.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}>
            <span className={screen === n.id ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"}>{n.icon}</span>
            <span className="flex-1 text-left">{n.label}</span>
            {n.kbd && <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${screen === n.id ? "bg-white/20" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>{n.kbd}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/60 p-3 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <ShieldCheck className="size-4 text-emerald-500" />
            {user?.name} · {ROLE_LABEL[user?.role || "cashier"]}
          </div>
          <div className="mt-2 text-[10px] leading-relaxed text-slate-400">
            {db.products.length} products · {db.batches.length} batches · stored on this computer
          </div>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
            <LogOut className="size-3.5" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onAbout }: { onAbout: () => void }) {
  const { db, user, navTo } = usePos();
  const [clock, setClock] = useState(nowHM());
  useEffect(() => {
    const t = setInterval(() => setClock(nowHM()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="lg:hidden">
        <button type="button" onClick={onAbout} className="flex items-center gap-2">
          <ZBMark size={30} />
          <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">ZB <span className="text-sky-500">SOFTWARE</span></span>
        </button>
      </div>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("pos-search", { detail: { mode: "all" } }))}
        className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-400 transition hover:border-indigo-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700">
        <Search className="size-4 text-indigo-500" />
        <span className="flex-1 text-left">Search products, customers, receipts…</span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">Ctrl+F</span>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:flex">
          <Clock className="size-4 text-emerald-500" />
          {fmtDate(todayISO())} · {clock}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-emerald-600 text-sm font-bold text-white">
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</div>
            <div className="text-[11px] text-slate-400">{ROLE_LABEL[user?.role || "cashier"]}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ScreenView({ tick }: { tick: number }) {
  const { screen, user } = usePos();
  const perm = screenPerm(screen);
  const allowed = user?.role === "admin" || (user?.perms || []).includes(perm);
  const s: Screen = allowed ? screen : "dashboard";
  const key = s + tick;
  switch (s) {
    case "dashboard": return <Dashboard key={key} />;
    case "pos": return <Pos key={key} />;
    case "purchases": return <Purchases key={key} />;
    case "products": return <Products key={key} />;
    case "inventory": return <Inventory key={key} />;
    case "customers": return <Customers key={key} />;
    case "suppliers": return <Suppliers key={key} />;
    case "accounts": return <Accounts key={key} />;
    case "reports": return <Reports key={key} />;
    case "users": return <Users key={key} />;
    case "settings": return <Settings key={key} />;
    default: return <Dashboard key={key} />;
  }
}

// ------------------------------------------------------------------ shortcuts
function GlobalShortcuts() {
  const { navTo, user } = usePos();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      // F-keys work even while typing (barcode scanners / POS entry)
      const f = e.key;
      if (f === "F1") { e.preventDefault(); navTo("pos"); }
      else if (f === "F2") { e.preventDefault(); window.dispatchEvent(new CustomEvent("pos-search", { detail: { mode: "product" } })); }
      else if (f === "F3") { e.preventDefault(); navTo("pos"); window.dispatchEvent(new CustomEvent("pos:new-sale")); }
      else if (f === "F4") { e.preventDefault(); window.dispatchEvent(new CustomEvent("pos-search", { detail: { mode: "customer" } })); }
      else if (f === "F5") { e.preventDefault(); window.dispatchEvent(new CustomEvent("zb:refresh")); }
      else if (f === "F6") { e.preventDefault(); if (user?.role === "admin" || user?.perms.includes("purchases")) navTo("purchases"); }
      else if (f === "F7") { e.preventDefault(); if (user?.role === "admin" || user?.perms.includes("inventory")) navTo("inventory"); }
      else if (f === "F8") { e.preventDefault(); navTo("pos"); window.dispatchEvent(new CustomEvent("pos:receipts")); }
      else if (f === "F9") { e.preventDefault(); window.dispatchEvent(new CustomEvent("pos:print")); }
      else if (f === "F10") { e.preventDefault(); window.dispatchEvent(new CustomEvent("pos:payment")); }
      else if (f === "F11") { e.preventDefault(); toggleFullscreen(); }
      else if (f === "F12") { e.preventDefault(); if (user?.role === "admin") navTo("settings"); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pos-search", { detail: { mode: "all" } }));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [navTo, user]);
  return null;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  else document.documentElement.requestFullscreen().catch(() => toast.error("Fullscreen is not available in this browser."));
}

// ------------------------------------------------------------------ search
type SearchMode = "all" | "product" | "customer";

interface SearchHit {
  type: string;
  title: string;
  sub: string;
  tone: "blue" | "green" | "violet" | "orange";
  go: () => void;
}

function SearchModal() {
  const { db, navTo, user, can } = usePos();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openFn = (e: Event) => {
      const m = (e as CustomEvent).detail?.mode || "all";
      setMode(m); setQ(""); setSel(0);
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 30);
    };
    window.addEventListener("pos-search", openFn);
    return () => window.removeEventListener("pos-search", openFn);
  }, []);

  const results = useMemo<SearchHit[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const out: SearchHit[] = [];
    const wantProducts = mode === "all" || mode === "product";
    const wantCustomers = mode === "all" || mode === "customer";

    if (wantProducts && (can("pos") || can("products"))) {
      for (const p of db.products) {
        if (!p.active) continue;
        if (p.name.toLowerCase().includes(t) || p.generic.toLowerCase().includes(t) || p.barcode.includes(t) ||
            p.altBarcode.includes(t) || p.code.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t) ||
            p.brand.toLowerCase().includes(t)) {
          const st = stockOf(db, p.id);
          const low = p.minStock > 0 && st < p.minStock;
          out.push({
            type: "Product", title: p.name, tone: "blue",
            sub: `${p.code} · ${db.settings.currency.symbol} ${fmtNum(p.retailPrice)} · Stock ${fmtNum(st)}${low ? " ⚠" : ""}`,
            go: () => {
              if (can("pos")) {
                window.dispatchEvent(new CustomEvent("pos:add-product", { detail: { productId: p.id, qty: 1 } }));
                navTo("pos");
              } else navTo("products", { productId: p.id });
            },
          });
        }
      }
    }
    if (wantCustomers && can("customers")) {
      for (const c of db.customers) {
        if (c.name.toLowerCase().includes(t) || c.phone.includes(t) || c.cnic.includes(t))
          out.push({
            type: "Customer", title: c.name, tone: "green",
            sub: `${c.phone || "—"} · Balance ${db.settings.currency.symbol} ${fmtNum(c.balance)}`,
            go: () => {
              window.dispatchEvent(new CustomEvent("pos:select-customer", { detail: { customerId: c.id } }));
              if (can("pos")) navTo("pos"); else navTo("customers");
            },
          });
      }
    }
    if (mode !== "product" && can("receipts")) {
      for (const s of db.sales) {
        if (s.status !== "final") continue;
        if (s.no.toLowerCase().includes(t) || s.customerName.toLowerCase().includes(t) || s.cashierName.toLowerCase().includes(t))
          out.push({ type: "Receipt", title: s.no, tone: "violet", sub: `${s.customerName} · ${s.date} · ${db.settings.currency.symbol} ${fmtNum(s.net)}`, go: () => navTo("pos", { view: "receipts" }) });
      }
    }
    if (mode === "all" && can("purchases")) {
      for (const p of db.purchases) {
        if (p.status !== "final") continue;
        if (p.no.toLowerCase().includes(t) || p.supplierName.toLowerCase().includes(t))
          out.push({ type: "Purchase", title: p.no, tone: "orange", sub: `${p.supplierName} · ${p.date}`, go: () => navTo("purchases") });
      }
    }
    return out.slice(0, 12);
  }, [q, db, navTo, user, mode, can]);

  useEffect(() => { setSel(0); }, [q, mode]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const r = results[sel]; if (r) { r.go(); setOpen(false); } }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  const modeTone = { all: "Search everything", product: "Search products — ENTER adds to the POS cart", customer: "Search customers — ENTER selects for the POS" }[mode];

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Search" subtitle={`${modeTone}. Use ↑ ↓ to move, ENTER to select, ESC to close.`} size="lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-indigo-500" />
        <Inp ref={inputRef} className="pl-9" placeholder="Type to search… (F2 = products, F4 = customers, Ctrl+F = everything)" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
      </div>
      <div className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto">
        {results.map((r, i) => (
          <button key={r.type + r.title + i} type="button" onMouseEnter={() => setSel(i)} onClick={() => { r.go(); setOpen(false); }}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              i === sel
                ? "border-indigo-500 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40"
                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}>
            <Tag tone={r.tone}>{r.type}</Tag>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{r.title}</div>
              <div className="truncate text-xs text-slate-400">{r.sub}</div>
            </div>
            {i === sel && <CornerDownLeft className="size-4 shrink-0 text-indigo-500" />}
          </button>
        ))}
        {q && !results.length && <p className="py-6 text-center text-sm text-slate-400">No results for “{q}”.</p>}
        {!q && (
          <div className="py-4">
            <Empty message="Start typing — products, customers, receipts and purchases." icon={<PackageSearch className="size-6" />} />
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><ArrowUp className="size-3" /><ArrowDown className="size-3" /> move</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="size-3" /> select</span>
              <span className="flex items-center gap-1">ESC close</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ confirm
function ConfirmModal() {
  const { confirmState, resolveConfirm } = usePos();
  if (!confirmState) return null;
  return (
    <Modal open onClose={() => resolveConfirm(false)} title={confirmState.title} size="sm"
      footer={
        <>
          <Btn variant="outline" onClick={() => resolveConfirm(false)}>Cancel</Btn>
          <Btn variant={confirmState.danger ? "danger" : "primary"} onClick={() => resolveConfirm(true)}>Confirm</Btn>
        </>
      }>
      <p className="text-sm text-slate-600 dark:text-slate-300">{confirmState.message}</p>
    </Modal>
  );
}

// ------------------------------------------------------------------ admin gate
function AdminGateModal() {
  const { adminGateState, submitAdminGate } = usePos();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adminGateState) {
      setPw(""); setErr(null);
      setTimeout(() => ref.current?.focus(), 30);
    }
  }, [adminGateState]);

  if (!adminGateState) return null;
  return (
    <Modal open onClose={() => adminGateState.resolve(false)} title={adminGateState.title} size="sm"
      footer={
        <>
          <Btn variant="outline" onClick={() => adminGateState.resolve(false)}>Cancel</Btn>
          <Btn icon={<ShieldCheck className="size-4" />} onClick={() => {
            const e = submitAdminGate(pw);
            if (e) setErr(e);
          }}>Verify &amp; Continue</Btn>
        </>
      }>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{adminGateState.message}</p>
      <Field label="Administrator password" required>
        <Inp ref={ref} type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { const er = submitAdminGate(pw); if (er) setErr(er); } }} placeholder="••••••••" autoFocus />
      </Field>
      {err && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{err}</div>}
    </Modal>
  );
}

// ------------------------------------------------------------------ force pw
function ForcePassword() {
  const { changePassword, logout } = usePos();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-600">
            <KeyRound className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Change Password Required</h1>
            <p className="text-xs text-slate-400">Security policy — set a new password to continue.</p>
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (next !== next2) { setErr("New passwords do not match."); return; }
          setBusy(true);
          setTimeout(() => {
            const e2 = changePassword(cur, next);
            setBusy(false);
            if (e2) setErr(e2);
          }, 200);
        }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <Field label="Current Password" required><Inp type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoFocus /></Field>
          <Field label="New Password" required hint="At least 6 characters."><Inp type="password" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <Field label="Confirm New Password" required><Inp type="password" value={next2} onChange={(e) => setNext2(e.target.value)} /></Field>
          {err && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{err}</div>}
          <Btn type="submit" className="w-full" loading={busy} icon={<KeyRound className="size-4" />}>Change Password</Btn>
          <button type="button" onClick={logout} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">Logout instead</button>
        </form>
      </div>
    </div>
  );
}
