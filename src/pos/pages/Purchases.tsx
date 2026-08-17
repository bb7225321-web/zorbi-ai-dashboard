import { useEffect, useMemo, useState } from "react";
import {
  Plus, Save, Printer, Pause, Undo2, Trash2, Search, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Tag, Money, Empty, TableX, Seg } from "../ui";
import {
  Purchase, PurchaseItem, Product, DiscType, uid, todayISO, nowHM, addDays, round2, fmtMoney, fmtNum, fmtDT,
  calcPurchaseTotals, lineTotal, nextNo,
} from "../core";

type Tab = "purchases" | "returns";

export function Purchases() {
  const { db, routeData, navTo, print, deletePurchaseDraft } = usePos();
  const sym = db.settings.currency.symbol;
  const [tab, setTab] = useState<Tab>("purchases");
  const [formOpen, setFormOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  useEffect(() => {
    const d = routeData as { new?: boolean } | null;
    if (d?.new) { setTab("purchases"); setFormOpen(true); }
  }, [routeData]);

  const purchases = useMemo(
    () => [...db.purchases].filter((p) => p.status === "final").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [db.purchases],
  );
  const returns = [...db.purchaseReturns].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Page
      title="Purchases & Goods Receipt"
      subtitle="Record supplier invoices — stock, batches and supplier ledgers update automatically."
      actions={
        <>
          <Seg<Tab> value={tab} onChange={setTab} options={[{ value: "purchases", label: "Purchases" }, { value: "returns", label: "Purchase Returns" }]} />
          {tab === "purchases" && <Btn icon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>New Purchase (F6)</Btn>}
        </>
      }
      wide
    >
      {tab === "purchases" ? (
        <Card pad={false}>
          <TableX
            cols={[
              { key: "no", label: "Invoice", sort: (p: Purchase) => p.no, render: (p: Purchase) => <span className="font-semibold">{p.no}</span> },
              { key: "dt", label: "Date", sort: (p: Purchase) => p.date + p.time, render: (p: Purchase) => <span className="text-xs">{fmtDT(p.date, p.time)}</span> },
              { key: "sup", label: "Supplier", render: (p: Purchase) => p.supplierName },
              { key: "inv", label: "Supplier Invoice", render: (p: Purchase) => <span className="font-mono text-xs">{p.invoiceNo || "—"}</span> },
              { key: "items", label: "Items", align: "center", render: (p: Purchase) => p.items.reduce((s, i) => s + i.qty, 0) },
              { key: "mode", label: "Mode", render: (p: Purchase) => <Tag tone={p.mode === "Cash" ? "green" : "violet"}>{p.mode}</Tag> },
              { key: "total", label: "Total", align: "right", sort: (p: Purchase) => p.total, render: (p: Purchase) => <Money v={p.total} symbol={sym} /> },
              { key: "st", label: "Status", render: (p: Purchase) => (p.returned ? <Tag tone="amber">Partial return</Tag> : <Tag tone="green">Received</Tag>) },
              { key: "act", label: "", align: "right", render: (p: Purchase) => (
                <div className="flex justify-end gap-1">
                  <IconBtn icon={<Printer className="size-4" />} label="Print invoice" onClick={() => print({ kind: "purchase", data: p.id })} />
                  <IconBtn icon={<RotateCcw className="size-4" />} label="Purchase return" tone="primary" onClick={() => { setTab("returns"); setReturnOpen(true); }} />
                </div>
              ) },
            ]}
            rows={purchases}
            rowKey={(p) => p.id}
            pageSize={12}
            empty="No purchases yet. Click New Purchase to receive stock."
          />
        </Card>
      ) : (
        <Card pad={false}>
          <TableX
            cols={[
              { key: "no", label: "Return No", render: (r) => <span className="font-semibold">{r.no}</span> },
              { key: "dt", label: "Date", render: (r) => <span className="text-xs">{fmtDate(r.date)}</span> },
              { key: "pur", label: "Purchase", render: (r) => r.purchaseNo },
              { key: "sup", label: "Supplier", render: (r) => r.supplierName },
              { key: "total", label: "Total", align: "right", render: (r) => <Money v={r.total} symbol={sym} /> },
              { key: "act", label: "", align: "right", render: (r) => <Btn size="sm" variant="outline" icon={<Printer className="size-4" />} onClick={() => print({ kind: "purchaseReturn", data: r.id })}>Print</Btn> },
            ]}
            rows={returns}
            rowKey={(r) => r.id}
            pageSize={12}
            empty="No purchase returns recorded."
          />
        </Card>
      )}

      {formOpen && <PurchaseForm onClose={() => setFormOpen(false)} />}
      {returnOpen && <PurchaseReturnModal onClose={() => setReturnOpen(false)} />}
    </Page>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ------------------------------------------------------------------ form
function PurchaseForm({ onClose }: { onClose: () => void }) {
  const { db, user, savePurchase, holdPurchase, deletePurchaseDraft } = usePos();
  const sym = db.settings.currency.symbol;
  const [supplierId, setSupplierId] = useState(db.suppliers[0]?.id || "");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [mode, setMode] = useState("Credit");
  const [comments, setComments] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(0);
  const [freight, setFreight] = useState(0);
  const [other, setOther] = useState(0);
  const [additional, setAdditional] = useState(0);
  const [advanceTax, setAdvanceTax] = useState(0);
  const [withTax, setWithTax] = useState(0);
  const [discType, setDiscType] = useState<DiscType>("pct");
  const [discValue, setDiscValue] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supplier = db.suppliers.find((s) => s.id === supplierId);
  const totals = calcPurchaseTotals(items, loading, freight, other, additional, db.settings.tax.purchaseTaxPct, { type: discType, value: discValue }, advanceTax, withTax);

  const setItem = (id: string, patch: Partial<PurchaseItem>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const buildDraft = (): Purchase => ({
    id: "", no: nextNo(db, "PUR"), supplierId, supplierName: supplier?.name || "",
    invoiceNo, billNo, billDate, dueDate, date: todayISO(), time: nowHM(), mode, comments,
    items: items.map((i) => ({ ...i, discount: round2((i.cost * i.qty * i.discountPct) / 100), tax: round2((i.cost * i.qty * i.taxPct) / 100), total: round2(i.cost * i.qty + round2((i.cost * i.qty * i.taxPct) / 100) - round2((i.cost * i.qty * i.discountPct) / 100)) })),
    subTotal: totals.subTotal, discountType: discType, discountValue: discValue, discount: totals.discountAmt, loading, freight, other, additional,
    tax: totals.tax, advanceTax, withTax, total: totals.total,
    status: "final", returned: false, userId: user?.id || "", userName: user?.name || "", createdAt: todayISO(),
  });

  const doSave = (printIt: boolean) => {
    setErr(null);
    if (!supplierId) { setErr("Select a supplier."); return; }
    if (!items.length) { setErr("Add at least one product."); return; }
    setBusy(true);
    setTimeout(() => {
      const e = savePurchase(buildDraft(), printIt);
      setBusy(false);
      if (e) setErr(e);
      else onClose();
    }, 150);
  };

  const doHold = () => {
    setErr(null);
    if (!items.length) { setErr("Add at least one product."); return; }
    const e = holdPurchase(buildDraft());
    if (e) setErr(e); else onClose();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const held = db.purchases.filter((p) => p.status === "hold");
  const [showHeld, setShowHeld] = useState(false);

  return (
    <Modal open onClose={onClose} title="New Purchase / Goods Receipt Note" subtitle={`Receipt No: ${nextNo(db, "PUR")} · ${todayISO()}`} size="full"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel (ESC)</Btn>
          {held.length > 0 && <Btn variant="outline" icon={<Undo2 className="size-4" />} onClick={() => setShowHeld(true)}>Retrieve ({held.length})</Btn>}
          <Btn variant="outline" icon={<Pause className="size-4" />} onClick={doHold}>Hold</Btn>
          <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => { const e = savePurchase(buildDraft(), true); if (e) setErr(e); else onClose(); }} loading={busy}>Save &amp; Print</Btn>
          <Btn variant="success" icon={<Save className="size-4" />} loading={busy} onClick={() => doSave(false)}>Save Purchase</Btn>
        </>
      }>
      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{err}</div>}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Supplier" required>
          <Sel value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">— Select supplier —</option>
            {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
        </Field>
        <Field label="Supplier Invoice No">
          <Inp value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
        </Field>
        <Field label="Bill No">
          <Inp value={billNo} onChange={(e) => setBillNo(e.target.value)} />
        </Field>
        <Field label="Bill Date">
          <Inp type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
        </Field>
        <Field label="Due Date">
          <Inp type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Payment Mode">
          <Sel value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>Cash</option><option>Credit</option><option>Bank Transfer</option><option>Card</option><option>Other</option>
          </Sel>
        </Field>
        <Field label="Comments" className="sm:col-span-2 lg:col-span-2">
          <Inp value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Optional notes" />
        </Field>
      </div>

      <div className="mt-5">
        <Card title={`Products (${items.length})`} pad={false}
          actions={<Btn size="sm" icon={<Plus className="size-4" />} onClick={() => setShowAdd(true)}>Add Product</Btn>}>
          <TableX
            cols={[
              { key: "name", label: "Product", render: (i: PurchaseItem) => <div><div className="font-medium">{i.productName}</div><div className="text-xs text-slate-400">{i.generic}</div></div> },
              { key: "batch", label: "Batch", render: (i: PurchaseItem) => <Inp className="w-28 py-1 text-xs" value={i.batchNo} onChange={(e) => setItem(i.id, { batchNo: e.target.value })} /> },
              { key: "exp", label: "Expiry", render: (i: PurchaseItem) => <input type="date" value={i.expDate} onChange={(e) => setItem(i.id, { expDate: e.target.value })} className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" /> },
              { key: "qty", label: "Qty", align: "right", render: (i: PurchaseItem) => <Num className="w-20 py-1 text-xs" value={i.qty} min={0} onChange={(e) => setItem(i.id, { qty: num(e.target.value) })} /> },
              { key: "free", label: "Free", align: "right", render: (i: PurchaseItem) => <Num className="w-16 py-1 text-xs" value={i.freeQty} min={0} onChange={(e) => setItem(i.id, { freeQty: num(e.target.value) })} /> },
              { key: "cost", label: "Cost", align: "right", render: (i: PurchaseItem) => <Num className="w-20 py-1 text-xs" value={i.cost} min={0} onChange={(e) => setItem(i.id, { cost: num(e.target.value) })} /> },
              { key: "retail", label: "Retail", align: "right", render: (i: PurchaseItem) => <Num className="w-20 py-1 text-xs" value={i.retail} min={0} onChange={(e) => setItem(i.id, { retail: num(e.target.value) })} /> },
              { key: "total", label: "Total", align: "right", render: (i: PurchaseItem) => <b className="tabular-nums">{fmtMoney(lineTotal(i.cost, i.qty, "pct", i.discountPct, i.taxPct).total, sym)}</b> },
              { key: "act", label: "", align: "right", render: (i: PurchaseItem) => <IconBtn icon={<Trash2 className="size-4" />} label="Remove" tone="danger" onClick={() => setItems(items.filter((x) => x.id !== i.id))} /> },
            ]}
            rows={items}
            rowKey={(i) => i.id}
            pageSize={100}
            empty="No products added. Click Add Product."
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Financial Details" pad={false}>
          <div className="space-y-2 p-4 text-sm">
            {[
              ["Sub Total", fmtMoney(totals.subTotal, sym)],
              ["Item Discount", `− ${fmtMoney(totals.itemDisc, sym)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-slate-500">{k}</span><span className="tabular-nums">{v}</span></div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Purchase Discount</span>
              <div className="flex items-center gap-1">
                <Sel value={discType} onChange={(e) => setDiscType(e.target.value as DiscType)} className="w-16 rounded-lg border border-slate-300 px-1 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <option value="pct">%</option>
                  <option value="amt">{sym}</option>
                </Sel>
                <Num className="w-24 py-1 text-xs" value={discValue} min={0} onChange={(e) => setDiscValue(num(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Discount Amount</span>
              <span className="tabular-nums text-emerald-600">− {fmtMoney(totals.discountAmt, sym)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Loading Expense</span>
              <Num className="w-24 py-1 text-xs" value={loading} min={0} onChange={(e) => setLoading(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Freight Expense</span>
              <Num className="w-24 py-1 text-xs" value={freight} min={0} onChange={(e) => setFreight(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Other Expense</span>
              <Num className="w-24 py-1 text-xs" value={other} min={0} onChange={(e) => setOther(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Additional Amount</span>
              <Num className="w-24 py-1 text-xs" value={additional} min={0} onChange={(e) => setAdditional(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Purchase Tax ({fmtNum(db.settings.tax.purchaseTaxPct)}%)</span>
              <span className="tabular-nums">{fmtMoney(totals.tax, sym)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Advance Tax</span>
              <Num className="w-24 py-1 text-xs" value={advanceTax} min={0} onChange={(e) => setAdvanceTax(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Withholding Tax</span>
              <Num className="w-24 py-1 text-xs" value={withTax} min={0} onChange={(e) => setWithTax(num(e.target.value))} />
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-base font-bold">Total Amount</span>
              <span className="text-lg font-bold text-emerald-600">{fmtMoney(totals.total, sym)}</span>
            </div>
          </div>
        </Card>

        <Card title="Help" className="lg:col-span-2">
          <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
            <p>• Enter <b>Batch Number</b> and <b>Expiry Date</b> for every item — this is mandatory for pharmacy stock control.</p>
            <p>• When saved, stock <b>increases</b> immediately and the supplier's payable ledger updates. Expired batches can never be sold unless enabled in Settings → Security.</p>
            <p>• <b>Free Quantity</b> is added to stock at zero cost.</p>
            <p>• Shortcut: <b>Ctrl+S</b> saves the purchase. Use <b>Hold</b> to pause and <b>Retrieve</b> to continue later.</p>
          </div>
        </Card>
      </div>

      {showAdd && <AddPurchaseItemModal
        onClose={() => setShowAdd(false)}
        onAdd={(item) => { setItems([...items, item]); setShowAdd(false); }}
        defaultSupplier={supplierId}
      />}

      {showHeld && (
        <Modal open onClose={() => setShowHeld(false)} title="Held Purchases" size="md">
          {held.length === 0 ? <Empty message="No held purchases." /> : (
            <div className="space-y-2">
              {held.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-semibold">{p.no} · {p.supplierName}</div>
                    <div className="text-xs text-slate-400">{p.items.length} items · {fmtMoney(p.total, sym)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" icon={<Undo2 className="size-4" />} onClick={() => {
                      setSupplierId(p.supplierId); setInvoiceNo(p.invoiceNo); setBillNo(p.billNo);
                      setBillDate(p.billDate); setDueDate(p.dueDate); setMode(p.mode); setComments(p.comments);
                      setItems(p.items); setLoading(p.loading); setFreight(p.freight); setOther(p.other);
                      setAdditional(p.additional); setAdvanceTax(p.advanceTax); setWithTax(p.withTax); setDiscType(p.discountType || "pct"); setDiscValue(p.discountValue || 0);
                      deletePurchaseDraft(p.id); setShowHeld(false);
                    }}>Retrieve</Btn>
                    <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={() => deletePurchaseDraft(p.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </Modal>
  );
}

function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

function AddPurchaseItemModal({ onClose, onAdd, defaultSupplier }: {
  onClose: () => void; onAdd: (i: PurchaseItem) => void; defaultSupplier: string;
}) {
  const { db } = usePos();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Product | null>(null);
  const [batchNo, setBatchNo] = useState("B-" + Math.floor(1000 + Math.random() * 9000));
  const [exp, setExp] = useState(addDays(todayISO(), 365));
  const [mfg, setMfg] = useState(todayISO());
  const [qty, setQty] = useState(10);
  const [free, setFree] = useState(0);
  const [cost, setCost] = useState(0);
  const [retail, setRetail] = useState(0);

  const products = db.products.filter((p) => {
    const t = q.toLowerCase();
    return !t || p.name.toLowerCase().includes(t) || p.generic.toLowerCase().includes(t) || p.code.toLowerCase().includes(t) || p.barcode.includes(t);
  });

  return (
    <Modal open onClose={onClose} title="Add Product to Purchase" subtitle="Select a product, then enter batch and expiry details." size="xl">
      <Inp autoFocus placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <TableX
          cols={[
            { key: "name", label: "Product", render: (p: Product) => (<div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.generic} · {p.brand}</div></div>) },
            { key: "stock", label: "Stock", align: "right", render: (p: Product) => fmtNum(db.batches.filter((b) => b.productId === p.id).reduce((s, b) => s + b.qty, 0)) },
            { key: "pur", label: "Purchase Price", align: "right", render: (p: Product) => fmtMoney(p.purchasePrice, db.settings.currency.symbol) },
            { key: "act", label: "", align: "right", render: (p: Product) => (
              <Btn size="sm" variant={sel?.id === p.id ? "dark" : "outline"} onClick={() => { setSel(p); setCost(p.purchasePrice); setRetail(p.retailPrice); }}>Select</Btn>
            ) },
          ]}
          rows={products.slice(0, 15)}
          rowKey={(p) => p.id}
          pageSize={15}
          empty="No products found."
        />
      </div>

      {sel && (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">{sel.name}</div>
              <div className="text-xs text-slate-400">{sel.generic}</div>
            </div>
            <Tag tone="blue">{sel.code}</Tag>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Batch No" required><Inp value={batchNo} onChange={(e) => setBatchNo(e.target.value)} /></Field>
            <Field label="Expiry" required><Inp type="date" value={exp} onChange={(e) => setExp(e.target.value)} /></Field>
            <Field label="Mfg"><Inp type="date" value={mfg} onChange={(e) => setMfg(e.target.value)} /></Field>
            <Field label="Qty" required><Num value={qty} min={0} onChange={(e) => setQty(num(e.target.value))} /></Field>
            <Field label="Free Qty"><Num value={free} min={0} onChange={(e) => setFree(num(e.target.value))} /></Field>
            <Field label="Cost" required><Num value={cost} min={0} onChange={(e) => setCost(num(e.target.value))} /></Field>
            <Field label="Retail Price"><Num value={retail} min={0} onChange={(e) => setRetail(num(e.target.value))} /></Field>
            <div className="flex items-end">
              <Btn className="w-full" icon={<Plus className="size-4" />} onClick={() => {
                if (!sel) return;
                if (qty <= 0) { toast.error("Quantity must be greater than zero."); return; }
                if (!batchNo.trim()) { toast.error("Batch number is required."); return; }
                onAdd({
                  id: uid(), productId: sel.id, productName: sel.name, generic: sel.generic,
                  batchNo: batchNo.trim(), mfgDate: mfg, expDate: exp, qty, freeQty: free,
                  cost, retail, discountPct: 0, taxPct: 0, discount: 0, tax: 0, total: round2(cost * qty),
                });
              }}>Add Item</Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ returns
function PurchaseReturnModal({ onClose }: { onClose: () => void }) {
  const { db, returnPurchase } = usePos();
  const sym = db.settings.currency.symbol;
  const [purchaseId, setPurchaseId] = useState("");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const purchases = [...db.purchases].filter((p) => p.status === "final").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const pur = db.purchases.find((p) => p.id === purchaseId);

  const returnedQty = (item: { productId: string; batchNo: string }) =>
    pur ? db.purchaseReturns.filter((r) => r.purchaseId === pur.id).flatMap((r) => r.items).filter((i) => i.productId === item.productId && i.batchNo === item.batchNo).reduce((s, i) => s + i.qty, 0) : 0;

  const submit = () => {
    if (!pur) { setErr("Select a purchase invoice."); return; }
    const lines = pur.items
      .filter((it) => (qtyMap[it.id] || 0) > 0)
      .map((it) => ({ productId: it.productId, batchId: db.batches.find((b) => b.productId === it.productId && b.batchNo === it.batchNo)?.id || "", batchNo: it.batchNo, qty: qtyMap[it.id] || 0 }));
    setBusy(true);
    setTimeout(() => {
      const e = returnPurchase(pur.id, lines, note);
      setBusy(false);
      if (e) setErr(e);
      else { setPurchaseId(""); setQtyMap({}); setNote(""); setErr(null); onClose(); }
    }, 150);
  };

  return (
    <Modal open onClose={onClose} title="Purchase Return" subtitle="Return goods to the supplier — batch stock and the supplier ledger are reduced automatically." size="xl"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" loading={busy} icon={<RotateCcw className="size-4" />} onClick={submit}>Process Return &amp; Print</Btn>
        </>
      }>
      {err && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{err}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Purchase Invoice" required>
          <Sel value={purchaseId} onChange={(e) => { setPurchaseId(e.target.value); setQtyMap({}); }}>
            <option value="">— Select purchase —</option>
            {purchases.map((p) => <option key={p.id} value={p.id}>{p.no} · {p.supplierName} · {fmtDate(p.date)} · {fmtMoney(p.total, sym)}</option>)}
          </Sel>
        </Field>
        <Field label="Notes"><Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" /></Field>
      </div>
      {pur && (
        <div className="mt-4">
          <TableX
            cols={[
              { key: "name", label: "Product", render: (i) => (<div><div className="font-medium">{i.productName}</div><div className="text-xs text-slate-400">Batch {i.batchNo} · Exp {i.expDate}</div></div>) },
              { key: "qty", label: "Purchased", align: "center", render: (i) => fmtNum(i.qty) },
              { key: "ret", label: "Returned", align: "center", render: (i) => <span className="font-semibold">{fmtNum(returnedQty(i))}</span> },
              { key: "cost", label: "Cost", align: "right", render: (i) => fmtMoney(i.cost, sym) },
              { key: "rqty", label: "Qty to Return", align: "right", render: (i) => (
                <input type="number" min={0} max={i.qty - returnedQty(i)} step="any" value={qtyMap[i.id] || 0}
                  onChange={(e) => setQtyMap({ ...qtyMap, [i.id]: Math.min(i.qty - returnedQty(i), Math.max(0, num(e.target.value))) })}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
              ) },
            ]}
            rows={pur.items}
            rowKey={(i) => i.id}
            pageSize={20}
            empty="No items."
          />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <span className="text-sm text-slate-500">Return total</span>
            <span className="text-lg font-bold text-rose-600">{fmtMoney(pur.items.filter((i) => (qtyMap[i.id] || 0) > 0).reduce((s, i) => s + (qtyMap[i.id] || 0) * i.cost, 0), sym)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
