import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Crosshair, LayoutDashboard, ShoppingCart, PackagePlus, Boxes, BarChart3, Users as UsersIcon,
  Truck, Wallet, FileBarChart2, UserCog, Settings as SettingsIcon, Search, LogOut,
  KeyRound, Clock, ShieldCheck,
} from "lucide-react";
import { PosProvider, usePos } from "./store";
import { PrintPortal } from "./print";
import { Modal, Btn, Field, Inp, Tag } from "./ui";
import { ROLE_LABEL, Role, Screen, fmtDate, todayISO, nowHM } from "./core";
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

const NAV: { id: Screen; label: string; icon: React.ReactNode; roles: Role[]; kbd?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-[18px]" />, roles: ["admin", "manager", "cashier"] },
  { id: "pos", label: "Point of Sale", icon: <ShoppingCart className="size-[18px]" />, roles: ["admin", "manager", "cashier"], kbd: "F1" },
  { id: "purchases", label: "Purchases", icon: <PackagePlus className="size-[18px]" />, roles: ["admin", "manager"], kbd: "F6" },
  { id: "products", label: "Products", icon: <Boxes className="size-[18px]" />, roles: ["admin", "manager"] },
  { id: "inventory", label: "Inventory", icon: <BarChart3 className="size-[18px]" />, roles: ["admin", "manager"] },
  { id: "customers", label: "Customers", icon: <UsersIcon className="size-[18px]" />, roles: ["admin", "manager", "cashier"] },
  { id: "suppliers", label: "Suppliers", icon: <Truck className="size-[18px]" />, roles: ["admin", "manager"] },
  { id: "accounts", label: "Accounts", icon: <Wallet className="size-[18px]" />, roles: ["admin", "manager"] },
  { id: "reports", label: "Reports", icon: <FileBarChart2 className="size-[18px]" />, roles: ["admin", "manager"] },
  { id: "users", label: "Users", icon: <UserCog className="size-[18px]" />, roles: ["admin"] },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="size-[18px]" />, roles: ["admin"] },
];

function canAccess(screen: Screen, role: Role): boolean {
  return NAV.find((n) => n.id === screen)?.roles.includes(role) ?? false;
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
  const { user, screen, navTo, logout, confirmState, confirm } = usePos();

  if (!user) return <Login />;
  if (user.mustChange) return <ForcePassword />;
  if (!canAccess(screen, user.role)) {
    // route to first accessible screen
    const first = NAV.find((n) => n.roles.includes(user.role))?.id || "dashboard";
    setTimeout(() => navTo(first), 0);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <ScreenView />
        </main>
      </div>
      <GlobalSearch />
      <ConfirmModal />
      <PrintPortal />
    </div>
  );
}

function Sidebar() {
  const { db, user, screen, navTo, logout } = usePos();
  const nav = NAV.filter((n) => n.roles.includes(user?.role || "cashier"));
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/30">
          <Crosshair className="size-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-white">MY PHARMACY</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">POS System</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {nav.map((n) => (
          <button key={n.id} type="button" onClick={() => navTo(n.id)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
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
            <ShieldCheck className="size-4 text-indigo-500" />
            {user?.name} · {ROLE_LABEL[user?.role || "cashier"]}
          </div>
          <div className="mt-2 text-[10px] leading-relaxed text-slate-400">
            {db.demo ? "DEMO database — data resets via Settings → Database." : `Data stored locally · ${db.products.length} products`}
          </div>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">
            <LogOut className="size-3.5" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { db, user, navTo } = usePos();
  const [clock, setClock] = useState(nowHM());
  useEffect(() => {
    const t = setInterval(() => setClock(nowHM()), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          <Crosshair className="size-5 text-indigo-600" />
          <span className="text-sm font-bold">MY PHARMACY POS</span>
        </div>
      </div>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("pos-search"))}
        className="flex h-10 flex-1 max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-400 transition hover:border-indigo-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-700">
        <Search className="size-4 text-indigo-500" />
        <span className="flex-1 text-left">Search products, customers, receipts…</span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:border-slate-600 dark:bg-slate-700">Ctrl+F</span>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:flex">
          <Clock className="size-4 text-indigo-500" />
          {fmtDate(todayISO())} · {clock}
        </div>
        {db.demo && <Tag tone="amber">DEMO</Tag>}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
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

function ScreenView() {
  const { screen, user } = usePos();
  const s: Screen = canAccess(screen, user?.role || "cashier") ? screen : "dashboard";
  switch (s) {
    case "dashboard": return <Dashboard />;
    case "pos": return <Pos />;
    case "purchases": return <Purchases />;
    case "products": return <Products />;
    case "inventory": return <Inventory />;
    case "customers": return <Customers />;
    case "suppliers": return <Suppliers />;
    case "accounts": return <Accounts />;
    case "reports": return <Reports />;
    case "users": return <Users />;
    case "settings": return <Settings />;
    default: return <Dashboard />;
  }
}

// ------------------------------------------------------------------ search
function GlobalSearch() {
  const { db, navTo, user } = usePos();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const openFn = () => { setOpen(true); setQ(""); };
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") { e.preventDefault(); openFn(); }
    };
    window.addEventListener("pos-search", openFn);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pos-search", openFn); window.removeEventListener("keydown", key); };
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const role = user?.role || "cashier";
    const out: { type: string; title: string; sub: string; go: () => void }[] = [];
    if (canAccess("products", role)) {
      for (const p of db.products) {
        if (p.name.toLowerCase().includes(t) || p.generic.toLowerCase().includes(t) || p.barcode.includes(t) || p.altBarcode.includes(t) || p.code.toLowerCase().includes(t))
          out.push({ type: "Product", title: p.name, sub: `${p.code} · ${fmtMoney2(p.retailPrice, db.settings.currency.symbol)}`, go: () => navTo("products", { productId: p.id }) });
      }
    }
    for (const c of db.customers) {
      if (c.name.toLowerCase().includes(t) || c.phone.includes(t))
        out.push({ type: "Customer", title: c.name, sub: c.phone || c.email, go: () => navTo("customers") });
    }
    if (canAccess("suppliers", role)) {
      for (const s of db.suppliers) {
        if (s.name.toLowerCase().includes(t) || s.phone.includes(t))
          out.push({ type: "Supplier", title: s.name, sub: s.phone, go: () => navTo("suppliers") });
      }
    }
    for (const s of db.sales) {
      if (s.no.toLowerCase().includes(t) || s.customerName.toLowerCase().includes(t))
        out.push({ type: "Receipt", title: s.no, sub: `${s.customerName} · ${s.date}`, go: () => navTo("pos", { view: "receipts" }) });
    }
    if (canAccess("purchases", role)) {
      for (const p of db.purchases) {
        if (p.no.toLowerCase().includes(t) || p.supplierName.toLowerCase().includes(t))
          out.push({ type: "Purchase", title: p.no, sub: p.supplierName, go: () => navTo("purchases") });
      }
    }
    return out.slice(0, 12);
  }, [q, db, navTo, user]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Global Search" subtitle="Ctrl+F anywhere — products, customers, suppliers, receipts, purchases." size="md">
      <Inp autoFocus placeholder="Type to search…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { results[0].go(); setOpen(false); } }} />
      <div className="mt-4 max-h-[50vh] space-y-1 overflow-y-auto">
        {results.map((r, i) => (
          <button key={i} type="button" onClick={() => { r.go(); setOpen(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-indigo-50 dark:hover:bg-slate-800">
            <Tag tone={r.type === "Product" ? "violet" : r.type === "Receipt" || r.type === "Purchase" ? "blue" : "green"}>{r.type}</Tag>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{r.title}</div>
              <div className="truncate text-xs text-slate-400">{r.sub}</div>
            </div>
          </button>
        ))}
        {q && !results.length && <p className="py-6 text-center text-sm text-slate-400">No results for “{q}”.</p>}
        {!q && <p className="py-6 text-center text-sm text-slate-400">Start typing to search across the whole database.</p>}
      </div>
    </Modal>
  );
}

function fmtMoney2(n: number, sym: string): string {
  return `${sym} ${n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

// ------------------------------------------------------------------ force pw
function ForcePassword() {
  const { changePassword, logout } = usePos();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600">
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
