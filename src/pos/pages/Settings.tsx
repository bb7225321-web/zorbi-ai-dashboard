import { useMemo, useRef, useState } from "react";
import { Save, DatabaseBackup, DatabaseZap, RotateCcw, Palette, ShieldCheck, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, Field, Inp, Num, Sel, Tag, TableX, Seg } from "../ui";
import { Settings as S, PAPER_SIZES, fmtDT } from "../core";

type Tab = "pharmacy" | "receipt" | "tax" | "inventory" | "security" | "appearance" | "database" | "audit";

export function Settings() {
  const { db, user, updateSettings, backup, restore, resetDemo, confirm } = usePos();
  const [tab, setTab] = useState<Tab>("pharmacy");
  const [draft, setDraft] = useState<S>(() => JSON.parse(JSON.stringify(db.settings)) as S);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<S>) => setDraft({ ...draft, ...patch });

  const audit = useMemo(() => [...db.audit].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 200), [db.audit]);
  const storageKB = useMemo(() => (JSON.stringify(db).length / 1024).toFixed(1), [db]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(db.settings);

  const tabs: { id: Tab; label: string }[] = [
    { id: "pharmacy", label: "Pharmacy" },
    { id: "receipt", label: "Receipt & Print" },
    { id: "tax", label: "Tax" },
    { id: "inventory", label: "Inventory" },
    { id: "security", label: "Security" },
    { id: "appearance", label: "Appearance" },
    { id: "database", label: "Database" },
    { id: "audit", label: "Audit Log" },
  ];

  return (
    <Page
      title="Settings"
      subtitle="Application configuration — saved locally on this computer."
      actions={
        <>
          <Seg<Tab> value={tab} onChange={setTab} options={tabs.map((t) => ({ value: t.id, label: t.label }))} />
          {dirty && tab !== "audit" && tab !== "database" && <Btn icon={<Save className="size-4" />} onClick={() => updateSettings(draft)}>Save Changes</Btn>}
        </>
      }
      wide
    >
      {tab === "pharmacy" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Pharmacy Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pharmacy Name" required className="sm:col-span-2">
                <Inp value={draft.pharmacy.name} onChange={(e) => set({ pharmacy: { ...draft.pharmacy, name: e.target.value } })} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Inp value={draft.pharmacy.address} onChange={(e) => set({ pharmacy: { ...draft.pharmacy, address: e.target.value } })} />
              </Field>
              <Field label="Phone"><Inp value={draft.pharmacy.phone} onChange={(e) => set({ pharmacy: { ...draft.pharmacy, phone: e.target.value } })} /></Field>
              <Field label="Email"><Inp value={draft.pharmacy.email} onChange={(e) => set({ pharmacy: { ...draft.pharmacy, email: e.target.value } })} /></Field>
              <Field label="License / Registration"><Inp value={draft.pharmacy.license} onChange={(e) => set({ pharmacy: { ...draft.pharmacy, license: e.target.value } })} /></Field>
              <Field label="Currency Symbol"><Inp value={draft.currency.symbol} onChange={(e) => set({ currency: { ...draft.currency, symbol: e.target.value } })} /></Field>
              <Field label="Receipt Footer Message" className="sm:col-span-2">
                <Inp value={draft.receipt.footer} onChange={(e) => set({ receipt: { ...draft.receipt, footer: e.target.value } })} />
              </Field>
            </div>
          </Card>
          <Card title="Receipt Header">
            <Field label="Header line (printed under the title)">
              <Inp value={draft.receipt.header} onChange={(e) => set({ receipt: { ...draft.receipt, header: e.target.value } })} />
            </Field>
            <p className="mt-4 text-xs text-slate-400">
              These details appear at the top of every receipt, invoice and report. A logo can be added in the desktop (Electron) build by placing a <code>logo.png</code> next to the app.
            </p>
          </Card>
        </div>
      )}

      {tab === "receipt" && (
        <Card title="Receipt & Printer Settings">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Default Paper Size" hint="Thermal 80mm and 58mm for receipt printers; A4/A5 for invoices and reports.">
              <Sel value={draft.receipt.paper} onChange={(e) => set({ receipt: { ...draft.receipt, paper: e.target.value as S["receipt"]["paper"] } })}>
                {PAPER_SIZES.map((s) => <option key={s} value={s}>{s === "58mm" ? "Thermal 58mm" : s === "80mm" ? "Thermal 80mm" : s}</option>)}
              </Sel>
            </Field>
            <Field label="Default Copies">
              <Num min={1} max={10} value={draft.receipt.copies} onChange={(e) => set({ receipt: { ...draft.receipt, copies: Math.max(1, Math.min(10, num(e.target.value))) } })} />
            </Field>
            <Field label="Header Line">
              <Inp value={draft.receipt.header} onChange={(e) => set({ receipt: { ...draft.receipt, header: e.target.value } })} />
            </Field>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Printing uses the system print dialog. In the packaged Windows app you can pick any installed printer (thermal or A4) — the preview shows exactly what will print.
          </p>
        </Card>
      )}

      {tab === "tax" && (
        <Card title="Tax Settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default Sales Tax %" hint="Applied to POS lines that have no product-specific tax rate.">
              <Num min={0} max={100} value={draft.tax.salesTaxPct} onChange={(e) => set({ tax: { ...draft.tax, salesTaxPct: num(e.target.value) } })} />
            </Field>
            <Field label="Default Purchase Tax %">
              <Num min={0} max={100} value={draft.tax.purchaseTaxPct} onChange={(e) => set({ tax: { ...draft.tax, purchaseTaxPct: num(e.target.value) } })} />
            </Field>
          </div>
          <p className="mt-4 text-xs text-slate-400">The Tax Report shows sales tax collected by day.</p>
        </Card>
      )}

      {tab === "inventory" && (
        <Card title="Inventory Settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Expiry Warning Window (days)" hint="Batches expiring within this window are highlighted as near-expiry.">
              <Num min={1} max={365} value={draft.inventory.expiryWarningDays} onChange={(e) => set({ inventory: { ...draft.inventory, expiryWarningDays: num(e.target.value) } })} />
            </Field>
          </div>
          <p className="mt-4 text-xs text-slate-400">Expired batches are blocked from sale and highlighted in red across the app.</p>
        </Card>
      )}

      {tab === "security" && (
        <Card title="Security">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><ShieldCheck className="size-4 text-indigo-500" /> Allow expired medicine sales</div>
              <p className="mt-0.5 text-xs text-slate-400">Off by default. Only enable if required — selling expired medicine is a serious safety risk.</p>
            </div>
            <input type="checkbox" checked={draft.security.allowExpiredSales} onChange={(e) => set({ security: { ...draft.security, allowExpiredSales: e.target.checked } })} className="size-5 accent-rose-500" />
          </div>
          <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            Passwords are managed in <b>Users &amp; Permissions</b> (administrator only). Every login, sale, purchase, adjustment, backup and restore is recorded in the audit log.
          </div>
        </Card>
      )}

      {tab === "appearance" && (
        <Card title="Appearance">
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => set({ appearance: "light" })}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${draft.appearance === "light" ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"}`}>
              <Palette className="size-6 text-indigo-500" />
              <div>
                <div className="text-sm font-semibold">Light</div>
                <div className="text-xs text-slate-400">Bright professional POS interface</div>
              </div>
            </button>
            <button type="button" onClick={() => set({ appearance: "dark" })}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${draft.appearance === "dark" ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"}`}>
              <Palette className="size-6 text-slate-700 dark:text-slate-200" />
              <div>
                <div className="text-sm font-semibold">Dark</div>
                <div className="text-xs text-slate-400">Low-glare evening mode</div>
              </div>
            </button>
          </div>
        </Card>
      )}

      {tab === "database" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Backup & Restore">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800">
                <span className="text-slate-500">Database size (local storage)</span>
                <b>{storageKB} KB</b>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn icon={<DatabaseBackup className="size-4" />} onClick={backup}>Backup Database</Btn>
                <Btn variant="outline" icon={<DatabaseZap className="size-4" />} onClick={() => fileRef.current?.click()}>Restore Database…</Btn>
                <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const ok = await confirm("Restore database?", "The current database will be backed up first, then replaced with the backup file contents.", true);
                  if (!ok) { e.target.value = ""; return; }
                  const err = await restore(f);
                  if (err) toast.error(err);
                  e.target.value = "";
                }} />
                <Btn variant="outline" icon={<RotateCcw className="size-4" />} onClick={async () => {
                  const ok = await confirm("Reset to demo data?", "All current data will be replaced with the original DEMO dataset.", true);
                  if (ok) resetDemo();
                }}>Reset Demo Data</Btn>
              </div>
              <p className="text-xs text-slate-400">A backup is a single JSON file containing the full database. Keep copies on a USB drive or cloud folder. Restore automatically creates a safety backup first.</p>
            </div>
          </Card>
          <Card title="Data & Privacy">
            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p>• The database lives entirely on this computer — no internet connection is required or used.</p>
              <p>• Product import accepts a JSON array of product objects (see README for the format).</p>
              <p>• CSV export is available on stock, products and all reports.</p>
              <p>• Signed in as <b>{user?.name}</b> ({user?.role}).</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "audit" && (
        <Card title="Audit Log" pad={false}
          actions={<Tag tone="blue"><ScrollText className="size-3" /> Last 200 events</Tag>}>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (a) => a.date + a.time, render: (a) => <span className="text-xs">{fmtDT(a.date, a.time)}</span> },
              { key: "user", label: "User", render: (a) => a.userName },
              { key: "action", label: "Action", render: (a) => <Tag tone="violet">{a.action}</Tag> },
              { key: "detail", label: "Detail", render: (a) => <span className="text-xs text-slate-500">{a.detail}</span> },
            ]}
            rows={audit}
            rowKey={(a) => a.id}
            pageSize={15}
            empty="No audit events."
          />
        </Card>
      )}
    </Page>
  );
}

function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
