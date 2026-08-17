import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, Barcode, Printer, Download, Upload, Layers, RefreshCcw, Save,
} from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Txta, Tag, Money, Empty, TableX } from "../ui";
import { Product, Purchase, fmtMoney, fmtNum, todayISO, addDays, expiryInfo, stockOf, uid, toCsv, download, UNITS, PRODUCT_TYPES } from "../core";
import { barcodeDataURL } from "../barcode";

const emptyProduct = (): Product => ({
  id: "", code: "", barcode: "", altBarcode: "", name: "", generic: "", brand: "",
  category: "", subCategory: "", group: "", supplierId: "", type: "Medicine",
  control: false, seasonal: false, unit: "Tab", purchaseUnit: "Tab", conversion: 1,
  avgCost: 0, purchasePrice: 0, retailPrice: 0, wholesalePrice: 0,
  minStock: 10, optStock: 50, maxStock: 100, taxPct: 0, discountPct: 0,
  location: "", notes: "", createdAt: todayISO(),
});

export function Products() {
  const { db, routeData, navTo, saveProduct, deleteProduct, print, confirm } = usePos();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sup, setSup] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [batchFor, setBatchFor] = useState<Product | null>(null);
  const [barcodeFor, setBarcodeFor] = useState<Product | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = routeData as { new?: boolean; productId?: string } | null;
    if (d?.new) { setEditing(null); setFormOpen(true); }
    else if (d?.productId) {
      const p = db.products.find((x) => x.id === d.productId);
      if (p) setEditing(p);
    }
  }, [routeData]);

  const cats = useMemo(() => [...new Set(db.products.map((p) => p.category).filter(Boolean))].sort(), [db.products]);

  const rows = db.products.filter((p) => {
    const t = q.toLowerCase();
    const okQ = !t || p.name.toLowerCase().includes(t) || p.generic.toLowerCase().includes(t) ||
      p.code.toLowerCase().includes(t) || p.barcode.includes(t) || p.altBarcode.includes(t) || p.brand.toLowerCase().includes(t);
    const okC = cat === "all" || p.category === cat;
    const okS = sup === "all" || p.supplierId === sup;
    return okQ && okC && okS;
  });

  const exportCsv = () => {
    const head = ["Code", "Name", "Generic", "Brand", "Category", "Barcode", "Supplier", "Stock", "Purchase Price", "Retail Price", "Min Stock", "Location"];
    const body = rows.map((p) => [
      p.code, p.name, p.generic, p.brand, p.category, p.barcode,
      db.suppliers.find((s) => s.id === p.supplierId)?.name || "", stockOf(db, p.id),
      p.purchasePrice, p.retailPrice, p.minStock, p.location,
    ]);
    download(`products-${todayISO()}.csv`, toCsv([head, ...body]), "text/csv");
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(String(reader.result));
        if (!Array.isArray(arr)) throw new Error("not array");
        let n = 0;
        for (const raw of arr) {
          if (!raw?.name) continue;
          const p = emptyProduct();
          Object.assign(p, raw, { id: "", createdAt: todayISO(), taxPct: Number(raw.taxPct) || 0, discountPct: Number(raw.discountPct) || 0 });
          saveProduct(p, true);
          n++;
        }
        toast.success(`${n} products imported.`);
      } catch {
        toastErr("Import failed — expected a JSON array of products.");
      }
    };
    reader.readAsText(file);
  };

  const cols = [
    { key: "code", label: "Code", sort: (p: Product) => p.code, render: (p: Product) => <span className="font-mono text-xs text-slate-500">{p.code}</span> },
    { key: "name", label: "Product", sort: (p: Product) => p.name, render: (p: Product) => (
      <div>
        <div className="font-medium text-slate-800 dark:text-slate-100">{p.name}</div>
        <div className="text-xs text-slate-400">{p.generic}{p.brand ? ` · ${p.brand}` : ""}</div>
      </div>
    ) },
    { key: "cat", label: "Category", render: (p: Product) => <Tag tone="violet">{p.category || "—"}</Tag> },
    { key: "sup", label: "Supplier", render: (p: Product) => db.suppliers.find((s) => s.id === p.supplierId)?.name || "—" },
    { key: "stock", label: "Stock", align: "right" as const, sort: (p: Product) => stockOf(db, p.id), render: (p: Product) => {
      const st = stockOf(db, p.id);
      const low = p.minStock > 0 && st < p.minStock;
      return <span className={low ? "font-bold text-rose-600" : "tabular-nums"}>{fmtNum(st)}</span>;
    } },
    { key: "retail", label: "Retail", align: "right" as const, sort: (p: Product) => p.retailPrice, render: (p: Product) => <Money v={p.retailPrice} symbol={sym} /> },
    { key: "flags", label: "", render: (p: Product) => (
      <div className="flex gap-1">
        {p.control && <Tag tone="red">Control</Tag>}
        {p.seasonal && <Tag tone="amber">Seasonal</Tag>}
      </div>
    ) },
    { key: "act", label: "", align: "right" as const, render: (p: Product) => (
      <div className="flex justify-end gap-1">
        <IconBtn icon={<Layers className="size-4" />} label="Batches & stock" tone="primary" onClick={() => setBatchFor(p)} />
        <IconBtn icon={<Barcode className="size-4" />} label="Barcode & label" onClick={() => setBarcodeFor(p)} />
        <IconBtn icon={<Pencil className="size-4" />} label="Edit" onClick={() => { setEditing(p); setFormOpen(true); }} />
        <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={async () => {
          const ok = await confirm(`Delete "${p.name}"?`, "This cannot be undone. Products with stock cannot be deleted.", true);
          if (ok) deleteProduct(p.id);
        }} />
      </div>
    ) },
  ];

  const toastErr = (m: string) => setFormErr(m);

  return (
    <Page
      title="Product Definition"
      subtitle={`${db.products.length} products · ${db.batches.length} batches in stock`}
      actions={
        <>
          <Btn variant="outline" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Import</Btn>
          <Btn variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>Export</Btn>
          <Btn icon={<Plus className="size-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>New Product</Btn>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
        </>
      }
      wide
    >
      <Card pad={false}
        actions={
          <div className="flex flex-wrap gap-2 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Inp className="w-64 pl-9" placeholder="Search name, generic, barcode, code…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Sel className="w-44" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
            <Sel className="w-48" value={sup} onChange={(e) => setSup(e.target.value)}>
              <option value="all">All suppliers</option>
              {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Sel>
          </div>
        }>
        <TableX
          cols={cols}
          rows={rows}
          rowKey={(p) => p.id}
          pageSize={12}
          onRowDoubleClick={(p) => { setEditing(p); setFormOpen(true); }}
          empty="No products found."
        />
      </Card>

      {formOpen && (
        <ProductForm
          product={editing}
          onClose={() => { setFormOpen(false); setFormErr(null); }}
          onSave={(p, isNew) => { const err = validate(p, db, isNew); if (err) { toastErr(err); return; } saveProduct(p, isNew); setFormOpen(false); }}
        />
      )}

      {batchFor && <BatchesModal product={batchFor} onClose={() => setBatchFor(null)} />}
      {barcodeFor && <BarcodeModal product={barcodeFor} onClose={() => setBarcodeFor(null)} />}
    </Page>
  );
}

function validate(p: Product, db: ReturnType<typeof usePos>["db"], isNew: boolean): string | null {
  if (!p.name.trim()) return "Product name is required.";
  if (!p.code.trim()) return "Product code is required.";
  if (db.products.some((x) => x.id !== p.id && x.code.toLowerCase() === p.code.trim().toLowerCase()))
    return `Duplicate product code: ${p.code}.`;
  if (p.barcode && db.products.some((x) => x.id !== p.id && x.barcode === p.barcode.trim()))
    return `Duplicate barcode: ${p.barcode}.`;
  if (p.retailPrice < 0 || p.purchasePrice < 0 || p.minStock < 0) return "Prices and stock levels cannot be negative.";
  return null;
}

// ------------------------------------------------------------------ form
function ProductForm({ product, onClose, onSave }: {
  product: Product | null; onClose: () => void; onSave: (p: Product, isNew: boolean) => void;
}) {
  const { db } = usePos();
  const [f, setF] = useState<Product>(product ? { ...product } : emptyProduct());
  const isNew = !product;
  const set = (patch: Partial<Product>) => setF({ ...f, ...patch });
  const genBarcode = () => {
    let code = "2" + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
    while (db.products.some((p) => p.barcode === code)) code = "2" + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
    set({ barcode: code });
  };
  const img = barcodeDataURL(f.barcode || f.code || "0");

  return (
    <Modal open onClose={onClose} title={isNew ? "New Product" : `Edit Product — ${product?.name}`} subtitle="All fields are saved to the local database." size="xl"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Save className="size-4" />} onClick={() => onSave(f, isNew)}>{isNew ? "Save Product" : "Update Product"}</Btn>
        </>
      }>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Product Name" required className="sm:col-span-2">
          <Inp value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Panadol Extra 500mg" />
        </Field>
        <Field label="Product Code" required>
          <Inp value={f.code} onChange={(e) => set({ code: e.target.value })} placeholder="PDT-1001" />
        </Field>
        <Field label="Barcode">
          <div className="flex gap-2">
            <Inp value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} placeholder="Scan or generate" />
            <Btn variant="outline" size="sm" icon={<Barcode className="size-4" />} onClick={genBarcode}>Generate</Btn>
          </div>
        </Field>
        <Field label="Alternate Barcode">
          <Inp value={f.altBarcode} onChange={(e) => set({ altBarcode: e.target.value })} />
        </Field>
        <Field label="Generic Name">
          <Inp value={f.generic} onChange={(e) => set({ generic: e.target.value })} placeholder="e.g. Paracetamol + Caffeine" />
        </Field>
        <Field label="Brand / Manufacturer">
          <Inp value={f.brand} onChange={(e) => set({ brand: e.target.value })} />
        </Field>
        <Field label="Category">
          <Inp value={f.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Analgesics" />
        </Field>
        <Field label="Sub Category">
          <Inp value={f.subCategory} onChange={(e) => set({ subCategory: e.target.value })} />
        </Field>
        <Field label="Product Group">
          <Inp value={f.group} onChange={(e) => set({ group: e.target.value })} />
        </Field>
        <Field label="Category Group">
          <Inp value={f.subCategory} onChange={(e) => set({ subCategory: e.target.value })} placeholder="alias of sub category" />
        </Field>
        <Field label="Supplier">
          <Sel value={f.supplierId} onChange={(e) => set({ supplierId: e.target.value })}>
            <option value="">— None —</option>
            {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel>
        </Field>
        <Field label="Product Type">
          <Sel value={f.type} onChange={(e) => set({ type: e.target.value })}>
            {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Sel>
        </Field>
        <Field label="Unit">
          <Sel value={f.unit} onChange={(e) => set({ unit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Sel>
        </Field>
        <Field label="Purchase Unit">
          <Sel value={f.purchaseUnit} onChange={(e) => set({ purchaseUnit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Sel>
        </Field>
        <Field label="Purchase Conversion Factor">
          <Num value={f.conversion} onChange={(e) => set({ conversion: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Average Cost">
          <Num value={f.avgCost} onChange={(e) => set({ avgCost: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Purchase Price">
          <Num value={f.purchasePrice} onChange={(e) => set({ purchasePrice: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Retail Price">
          <Num value={f.retailPrice} onChange={(e) => set({ retailPrice: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Wholesale Price">
          <Num value={f.wholesalePrice} onChange={(e) => set({ wholesalePrice: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Minimum Stock">
          <Num value={f.minStock} onChange={(e) => set({ minStock: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Optimal Stock">
          <Num value={f.optStock} onChange={(e) => set({ optStock: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Maximum Stock">
          <Num value={f.maxStock} onChange={(e) => set({ maxStock: num(e.target.value) })} min={0} />
        </Field>
        <Field label="Tax %">
          <Num value={f.taxPct} onChange={(e) => set({ taxPct: num(e.target.value) })} min={0} max={100} />
        </Field>
        <Field label="Default Discount %">
          <Num value={f.discountPct} onChange={(e) => set({ discountPct: num(e.target.value) })} min={0} max={100} />
        </Field>
        <Field label="Location / Rack">
          <Inp value={f.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. A1" />
        </Field>
        <div className="flex items-end gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={f.control} onChange={(e) => set({ control: e.target.checked })} className="size-4 accent-indigo-600" />
            Control Drug
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={f.seasonal} onChange={(e) => set({ seasonal: e.target.checked })} className="size-4 accent-indigo-600" />
            Seasonal Product
          </label>
        </div>
        <Field label="Notes" className="sm:col-span-2">
          <Txta value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>
      {img && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
          <img src={img} alt="barcode" className="h-10" />
          <span className="font-mono text-xs text-slate-500">{f.barcode || f.code}</span>
        </div>
      )}
    </Modal>
  );
}

function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }

// ------------------------------------------------------------------ batches
function BatchesModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { db, adjustStock, print } = usePos();
  const sym = db.settings.currency.symbol;
  const batches = db.batches.filter((b) => b.productId === product.id).sort((a, b) => a.expDate.localeCompare(b.expDate));
  const [addOpen, setAddOpen] = useState(false);
  const [adj, setAdj] = useState<{ id: string; delta: string; reason: string } | null>(null);

  return (
    <Modal open onClose={onClose} title={`Batches — ${product.name}`} subtitle={`Total stock: ${fmtNum(batches.reduce((s, b) => s + b.qty, 0))} ${product.unit}`} size="xl"
      footer={<Btn variant="outline" onClick={onClose}>Close</Btn>}>
      <div className="mb-4 flex justify-end">
        <Btn size="sm" icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>Add Batch</Btn>
      </div>
      <TableX
        cols={[
          { key: "batchNo", label: "Batch", sort: (b) => b.batchNo, render: (b) => <span className="font-mono text-xs font-semibold">{b.batchNo}</span> },
          { key: "mfg", label: "Mfg", render: (b) => <span className="text-xs">{b.mfgDate || "—"}</span> },
          { key: "exp", label: "Expiry", sort: (b) => b.expDate, render: (b) => {
            const info = expiryInfo(b, db.settings.inventory.expiryWarningDays);
            const tone = info.tone === "red" ? "red" : info.tone === "amber" ? "amber" : info.tone === "yellow" ? "orange" : "green";
            return <div className="flex items-center gap-2"><span className="text-xs">{b.expDate}</span><Tag tone={tone as "red"}>{info.label}</Tag></div>;
          } },
          { key: "qty", label: "Qty", align: "right" as const, sort: (b) => b.qty, render: (b) => <b className={b.qty <= 0 ? "text-rose-500" : ""}>{fmtNum(b.qty)}</b> },
          { key: "cost", label: "Cost", align: "right" as const, render: (b) => fmtMoney(b.cost, sym) },
          { key: "price", label: "Sale Price", align: "right" as const, render: (b) => fmtMoney(b.salePrice, sym) },
          { key: "act", label: "", align: "right" as const, render: (b) => (
            <div className="flex justify-end gap-1">
              <IconBtn icon={<RefreshCcw className="size-4" />} label="Adjust stock" onClick={() => setAdj({ id: b.id, delta: "0", reason: "" })} />
              <IconBtn icon={<Printer className="size-4" />} label="Print batch label" onClick={() => print({ kind: "labels", data: [{ name: product.name, price: fmtMoney(b.salePrice, sym), barcode: product.barcode || product.code, extra: `Batch ${b.batchNo} · Exp ${b.expDate}` }] })} />
            </div>
          ) },
        ]}
        rows={batches}
        rowKey={(b) => b.id}
        pageSize={10}
        empty="No batches yet. Add one or record a purchase."
      />

      {addOpen && <AddBatchForm product={product} onClose={() => setAddOpen(false)} />}

      {adj && (
        <Modal open onClose={() => setAdj(null)} title="Stock Adjustment" subtitle={`Adjust quantity for batch ${db.batches.find((b) => b.id === adj.id)?.batchNo}`} size="sm"
          footer={
            <>
              <Btn variant="outline" onClick={() => setAdj(null)}>Cancel</Btn>
              <Btn variant="warn" icon={<RefreshCcw className="size-4" />} onClick={async () => {
                const err = adjustStock(product.id, adj.id, num(adj.delta), adj.reason || "Manual adjustment");
                if (err) toastErr(err);
                setAdj(null);
              }}>Apply Adjustment</Btn>
            </>
          }>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delta (+ / −)" required>
              <Num value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} />
            </Field>
            <Field label="Reason" required>
              <Inp value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="e.g. Breakage, expiry, count" />
            </Field>
          </div>
          <p className="mt-3 text-xs text-slate-400">An audit record is created for every adjustment. Current stock: {fmtNum(db.batches.find((b) => b.id === adj.id)?.qty || 0)}</p>
        </Modal>
      )}
    </Modal>
  );
}

function AddBatchForm({ product, onClose }: { product: Product; onClose: () => void }) {
  const { db, savePurchase, confirm } = usePos();
  const [f, setF] = useState({ batchNo: "", mfg: todayISO(), exp: addDays(todayISO(), 365), qty: 0, cost: product.purchasePrice || 0, salePrice: product.retailPrice || 0 });
  const set = (patch: Partial<typeof f>) => setF({ ...f, ...patch });
  return (
    <Modal open onClose={onClose} title={`Add Batch — ${product.name}`} subtitle="Adds stock directly (an audit record is created). For supplier-linked stock, use Purchases." size="md"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Plus className="size-4" />} onClick={() => {
            if (!f.batchNo.trim()) { toastErr("Batch number is required."); return; }
            if (f.qty <= 0) { toastErr("Quantity must be greater than zero."); return; }
            confirm(`Add batch ${f.batchNo} with ${fmtNum(f.qty)} units?`, "Stock will increase immediately.", false).then((ok) => {
              if (!ok) return;
              const draft: Purchase = {
                id: "", no: "", supplierId: db.suppliers[0]?.id || "", supplierName: db.suppliers[0]?.name || "—",
                invoiceNo: "", billNo: "", billDate: todayISO(), dueDate: "", date: todayISO(), time: "00:00",
                mode: "Cash", comments: "Manual batch entry",
                items: [{
                  id: uid(), productId: product.id, productName: product.name, generic: product.generic,
                  batchNo: f.batchNo.trim(), mfgDate: f.mfg, expDate: f.exp,
                  qty: f.qty, freeQty: 0, cost: f.cost, retail: f.salePrice,
                  discountPct: 0, taxPct: 0, discount: 0, tax: 0, total: f.qty * f.cost,
                }],
                subTotal: f.qty * f.cost, discount: 0, loading: 0, freight: 0, other: 0, additional: 0,
                tax: 0, advanceTax: 0, withTax: 0, total: f.qty * f.cost,
                status: "final", returned: false, userId: "", userName: "", createdAt: todayISO(),
              };
              const err = savePurchase(draft, false);
              if (err) toastErr(err); else onClose();
            });
          }}>Save Batch</Btn>
        </>
      }>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Batch Number" required><Inp value={f.batchNo} onChange={(e) => set({ batchNo: e.target.value })} /></Field>
        <Field label="Expiry Date" required><Inp type="date" value={f.exp} onChange={(e) => set({ exp: e.target.value })} /></Field>
        <Field label="Manufacturing Date"><Inp type="date" value={f.mfg} onChange={(e) => set({ mfg: e.target.value })} /></Field>
        <Field label="Quantity" required><Num value={f.qty} onChange={(e) => set({ qty: num(e.target.value) })} min={0} /></Field>
        <Field label="Cost per unit"><Num value={f.cost} onChange={(e) => set({ cost: num(e.target.value) })} min={0} /></Field>
        <Field label="Sale price per unit"><Num value={f.salePrice} onChange={(e) => set({ salePrice: num(e.target.value) })} min={0} /></Field>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ barcode
function BarcodeModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { print, db } = usePos();
  const sym = db.settings.currency.symbol;
  const img = barcodeDataURL(product.barcode || product.code || "0", 60);
  return (
    <Modal open onClose={onClose} title={`Barcode — ${product.name}`} size="sm"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          <Btn icon={<Printer className="size-4" />} onClick={() => print({ kind: "product", data: product.id })}>Print Label</Btn>
        </>
      }>
      {img ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700">
          <img src={img} alt="barcode" className="h-16" />
          <span className="font-mono text-sm tracking-widest">{product.barcode || product.code}</span>
          <div className="text-sm font-semibold">{product.name}</div>
          <div className="text-lg font-bold text-indigo-600">{fmtMoney(product.retailPrice, sym)}</div>
        </div>
      ) : (
        <Empty message="No barcode set for this product." />
      )}
    </Modal>
  );
}

function toastErr(m: string) {
  toast.error(m);
}
