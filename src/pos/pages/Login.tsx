import { useState } from "react";
import { Lock, User as UserIcon, LogIn, XCircle, ShieldCheck, Crosshair } from "lucide-react";
import { usePos } from "../store";
import { Btn, Field, Inp } from "../ui";
import { toast } from "sonner";
import { ZBMark } from "../logo";
import { APP_NAME, APP_SUBTITLE, APP_COPYRIGHT } from "../core";

export function Login() {
  const { login, db } = usePos();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The default administrator password is only shown while it is still the
  // factory default (mustChange = true). It disappears once changed.
  const admin = db.users.find((u) => u.role === "admin" && u.active);
  const showFirstRunHint = !!admin?.mustChange;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) { setError("Please enter username and password."); return; }
    setBusy(true);
    setTimeout(() => {
      const err = login(username, password);
      setBusy(false);
      if (err) setError(err);
      else setError(null);
    }, 250);
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-[#0e46c9] via-[#123a9e] to-[#0b7a5a] lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <button type="button" className="zb-logo flex w-fit items-center gap-3 rounded-xl" onClick={() => toast.info("ZB SOFTWARE — Pharmacy POS & Inventory System")}>
            <span className="zb-logo-mark relative inline-flex">
              <ZBMark size={46} />
              <span className="zb-logo-ripple" aria-hidden />
            </span>
            <span className="text-left">
              <span className="block text-lg font-extrabold tracking-tight text-white">ZB <span className="text-sky-300">SOFTWARE</span></span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">{APP_SUBTITLE}</span>
            </span>
          </button>
          <div>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
              Complete pharmacy management, offline-first.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-100">
              Point of sale, batch &amp; expiry control, purchases, stock, ledgers,
              reports and printing — all in one fast desktop application. Works fully
              offline on a single computer.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                ["FEFO", "First-expiry stock control"],
                ["Barcodes", "Scanner & label printing"],
                ["Thermal", "58mm / 80mm receipts"],
              ].map(([t, s]) => (
                <div key={t} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <div className="text-sm font-semibold text-white">{t}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-indigo-100">{s}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-indigo-200/80">{APP_COPYRIGHT}</p>
        </div>
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="zb-logo-mark relative inline-flex">
              <ZBMark size={44} />
            </span>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">ZB <span className="text-sky-500">SOFTWARE</span></div>
              <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{APP_SUBTITLE}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to open the POS.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Username" required>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Inp className="pl-9" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Inp className="pl-9" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                <XCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Btn type="submit" loading={busy} className="flex-1" icon={<LogIn className="size-4" />}>Login</Btn>
              <Btn type="button" variant="outline" onClick={() => toast.info("Close this tab or window to exit the application.")}>
                Exit
              </Btn>
            </div>
          </form>

          {showFirstRunHint && (
            <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <ShieldCheck className="size-4" /> First-time setup
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Default administrator: <b>admin</b> / <b>admin123</b>. You will be
                required to change this password on first login — it will never be
                shown again.
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Crosshair className="size-3" /> {APP_NAME} · Data stays on this computer
          </div>
        </div>
      </div>
    </div>
  );
}
