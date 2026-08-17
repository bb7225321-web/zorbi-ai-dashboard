import { useState } from "react";
import { Crosshair, Lock, User as UserIcon, LogIn, XCircle, ShieldCheck } from "lucide-react";
import { usePos } from "../store";
import { Btn, Field, Inp } from "../ui";
import { toast } from "sonner";

export function Login() {
  const { login } = usePos();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const quick = (u: string, p: string) => {
    setUsername(u); setPassword(p); setError(null);
    setTimeout(() => login(u, p), 50);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Crosshair className="size-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white">MY PHARMACY POS</div>
              <div className="text-xs text-indigo-200">Medical Store Management System</div>
            </div>
          </div>
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
          <p className="text-xs text-indigo-200/80">© {new Date().getFullYear()} My Pharmacy POS · Offline desktop edition</p>
        </div>
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600">
              <Crosshair className="size-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">MY PHARMACY POS</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Medical Store Management System</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to open the POS.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Username" required>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Inp className="pl-9" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Inp className="pl-9" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
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

          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="size-4" /> Demo accounts
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {[
                ["Administrator", "admin", "admin123"],
                ["Manager", "manager", "manager123"],
                ["Cashier", "cashier", "cashier123"],
              ].map(([role, u, pw]) => (
                <button key={u} type="button" onClick={() => quick(u!, pw!)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-white dark:hover:bg-slate-800">
                  <span className="font-medium">{role}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">{u} / {pw}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">The first login as <b>admin</b> forces a password change.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
