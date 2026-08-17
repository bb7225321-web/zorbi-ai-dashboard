import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScanBarcode, Plus, Trash2, Save, Printer, Pause, Undo2, RotateCcw, Search,
  FileSearch, Banknote, CreditCard, ReceiptText, UserRound, X, RefreshCcw, Layers,
} from "lucide-react";
import { usePos } from "../store";
import {
  Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Tag, Money, Empty, TableX, Seg,
} from "../ui";
import {
  Product, Sale, PayMethod, uid, todayISO, nowHM, round2, fmtMoney, fmtNum, fmtDT,
  calcSaleTotals, lineTotal, allocateFEFO, availableBatches, expiryInfo,
  findProduct, WALKIN_ID, stockOf, nextNo,
} from "../core";

interface CartLine {
  productId: string; productName: string; generic: string;
  batchId: string; batchNo: string; expDate: string; unit: string;
  rate: number; qty: number; discountPct: number; taxPct: number; cost: number;
}

type PosView = "sale" | "receipts";

export function Pos() {
  const { db, user, navTo, saveSale, holdSale, deleteHold, returnSale, alreadyReturned, print } = usePos();
  const sym = db.settings.currency.symbol;
  const [view, setView] = useState<PosView>("sale");
  const [customerId, setCustomerId] = useState(WALKIN_ID);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [receiptDiscPct, setReceiptDiscPct] = useState(0);
  const [additional, setAdditional] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [method, setMethod] = useState<PayMethod>("cash");
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState("");
  const [lastSaleNo, setLastSaleNo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // modals
  const [showSearch, setShowSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [pending, setPending] = useState<{ product: Product; qty: number; replace?: boolean } | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [showHolds, setShowHolds] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const scanRef = useRef<HTMLInputElement>(null);

  const customer = db.customers.find((c) => c.id === customerId);
  const salesTaxPct = db.settings.tax.salesTaxPct;

  // ---------------- totals ----------------
  const totals = useMemo(
    () => calcSaleTotals(lines.map((l) => ({ rate: l.rate, qty: l.qty, discountPct: l.discountPct, taxPct: l.taxPct, cost: l.cost })), receiptDiscPct, additional, advance, salesTaxPct),
    [lines, receiptDiscPct, additional, advance, salesTaxPct],
  );
  const change = method === "cash" ? Math.max(0, round2(paid - totals.net)) : 0;
  const balance = Math.max(0, round2(totals.net - paid));

  const toastErr = (m: string) => setErrMsg(m);

  const makeLine = (prod: Product, bt: { id: string; batchNo: string; expDate: string; salePrice: number; cost: number }, qty: number): CartLine => ({
    productId: prod.id, productName: prod.name, generic: prod.generic,
    batchId: bt.id, batchNo: bt.batchNo, expDate: bt.expDate, unit: prod.unit,
    rate: bt.salePrice || prod.retailPrice, qty,
    discountPct: prod.discountPct, taxPct: prod.taxPct || salesTaxPct, cost: bt.cost,
  });

  // ---------------- add / edit cart ----------------
  const addProduct = (product: Product, qty = 1) => {
    const usable = availableBatches(db, product.id, db.settings.security.allowExpiredSales);
    if (!usable.length) {
      toastErr(`No sellable batch available for ${product.name}.`);
      return;
    }
    if (usable.length === 1) {
      addLine(product, usable[0].id, qty);
    } else {
      setPending({ product, qty });
    }
  };

  const addLine = (product: Product, batchId: string, qty: number, auto = true) => {
    if (auto) {
      const alloc = allocateFEFO(db, product.id, qty, db.settings.security.allowExpiredSales);
      if (typeof alloc === "string") { toastErr(alloc); return; }
      const next = [...lines];
      for (const a of alloc) {
        const bt = db.batches.find((b) => b.id === a.batchId)!;
        const existing = next.find((l) => l.batchId === a.batchId && l.productId === product.id);
        const line = makeLine(product, bt, a.qty);
        if (existing) existing.qty = round2(existing.qty + a.qty);
        else next.push(line);
      }
      setLines(next);
      return;
    }
    // specific batch
    const bt = db.batches.find((b) => b.id === batchId)!;
    if (bt.qty < qty) { toastErr(`Insufficient stock in batch ${bt.batchNo}.`); return; }
    const existing = lines.find((l) => l.batchId === batchId && l.productId === product.id);
    const line = makeLine(product, bt, qty);
    if (existing) {
      if (bt.qty < existing.qty + qty) { toastErr(`Insufficient stock in batch ${bt.batchNo}.`); return; }
      existing.qty = round2(existing.qty + qty);
    } else setLines([...lines, line]);
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) { setLines(lines.filter((l) => l.productId !== productId)); return; }
    const prod = db.products.find((p) => p.id === productId);
    if (!prod) return;
    // remove all lines for product, re-allocate FEFO
    const remaining = lines.filter((l) => l.productId !== productId);
    const alloc = allocateFEFO(db, productId, qty, db.settings.security.allowExpiredSales);
    if (typeof alloc === "string") { toastErr(alloc); return; }
    const next = [...remaining];
    for (const a of alloc) {
      const bt = db.batches.find((b) => b.id === a.batchId)!;
      next.push(makeLine(prod, bt, a.qty));
    }
    setLines(next);
  };

  const updateLine = (batchId: string, productId: string, patch: Partial<CartLine>) =>
    setLines(lines.map((l) => (l.batchId === batchId && l.productId === productId ? { ...l, ...patch } : l)));

  const changeBatch = (productId: string) => {
    const prod = db.products.find((p) => p.id === productId);
    if (!prod) return;
    const qty = lines.filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0);
    setPending({ product: prod, qty, replace: true });
  };

  const removeLine = (batchId: string, productId: string) =>
    setLines(lines.filter((l) => !(l.batchId === batchId && l.productId === productId)));

  const clearCart = () => {
    setLines([]); setReceiptDiscPct(0); setAdditional(0); setAdvance(0); setPaid(0);
    setMethod("cash"); setNotes(""); setErrMsg(null);
  };

  // ---------------- scan ----------------
  const handleScan = (code: string) => {
    const q = code.trim();
    if (!q) return;
    const prod = findProduct(db, q);
    if (!prod) { toastErr(`Product not found for "${q}".`); return; }
    addProduct(prod, 1);
  };

  // scanner that works while typing anywhere (keyboard-wedge scanners)
  const buf = useRef("");
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "Enter") {
        if (!typing && buf.current.length >= 4) { handleScan(buf.current); buf.current = ""; }
        else if (!typing) buf.current = "";
        return;
      }
      if (typing) return;
      if (/^[0-9]$/.test(e.key)) buf.current += e.key;
      else if (e.key.length === 1) buf.current = "";
      if (buf.current.length > 32) buf.current = buf.current.slice(-32);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lines, db]);

  // ---------------- save / hold ----------------
  const buildDraft = (): Sale | string => {
    if (!lines.length) return "Add at least one product to the sale.";
    const items = lines.map((l) => {
      const lt = lineTotal(l.rate, l.qty, l.discountPct, l.taxPct);
      return {
        id: uid(), productId: l.productId, productName: l.productName, generic: l.generic,
        batchId: l.batchId, batchNo: l.batchNo, expDate: l.expDate, unit: l.unit,
        rate: l.rate, qty: l.qty, discountPct: l.discountPct, taxPct: l.taxPct,
        discount: lt.discount, tax: lt.tax, total: lt.total, cost: l.cost,
      };
    });
    const draft: Sale = {
      id: "", no: nextNo(db, "SALE"), date: todayISO(), time: nowHM(),
      customerId, customerName: customer?.name || "Walk-in Customer", customerPhone: customer?.phone || "",
      cashierId: user?.id || "", cashierName: user?.name || "",
      items, gross: totals.gross, itemDisc: totals.itemDisc, receiptDiscPct, receiptDisc: totals.receiptDisc,
      tax: totals.tax, additional, advance, net: totals.net,
      method, paid: method === "credit" ? 0 : paid, change: method === "credit" ? 0 : change,
      balance: method === "credit" ? totals.net : balance,
      status: "final", returned: false, notes, createdAt: "",
    };
    if (method === "credit" && customerId === WALKIN_ID) return "Select a customer for credit sales.";
    return draft;
  };

  const doSave = (printIt: boolean) => {
    setErrMsg(null); setBusy(true);
    setTimeout(() => {
      const draft = buildDraft();
      if (typeof draft === "string") { toastErr(draft); setBusy(false); return; }
      const err = saveSale(draft, printIt);
      setBusy(false);
      if (err) { toastErr(err); return; }
      setLastSaleNo(draft.no);
      clearCart();
    }, 150);
  };

  const doHold = () => {
    setErrMsg(null);
    const draft = buildDraft();
    if (typeof draft === "string") { toastErr(draft); return; }
    const err = holdSale(draft);
    if (err) toastErr(err);
    else clearCart();
  };

  const holds = db.sales.filter((s) => s.status === "hold").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // ---------------- keyboard shortcuts ----------------
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "F1") { e.preventDefault(); clearCart(); setView("sale"); }
      else if (e.key === "F2") { e.preventDefault(); scanRef.current?.focus(); setShowSearch(false); }
      else if (e.key === "F4") { e.preventDefault(); doHold(); }
      else if (e.key === "F5") { e.preventDefault(); setShowHolds(true); }
      else if (e.key === "F7") { e.preventDefault(); if (lastSaleNo) { const s = db.sales.find((x) => x.no === lastSaleNo); if (s) print({ kind: "sale", data: s.id }); } else toastErr("No sale saved in this session yet."); }
      else if (e.key === "F8") { e.preventDefault(); setView("receipts"); }
      else if (e.key === "F9") { e.preventDefault(); if (lines.length) setShowPay(true); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(false); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); doSave(true); }
      else if (e.key === "Escape" && typing) (t as HTMLInputElement).blur();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [lines, customerId, receiptDiscPct, additional, advance, method, paid, notes, totals, lastSaleNo, db, errMsg]);

  // ---------------- render ----------------
  if (view === "receipts") {
    return <ReceiptsView onBack={() => setView("sale")} onReturn={() => setShowReturn(true)} />;
  }

  const lineCols = [
    { key: "name", label: "Product", render: (l: CartLine) => (
      <div>
        <div className="font-medium text-slate-800 dark:text-slate-100">{l.productName}</div>
        <div className="text-[11px] text-slate-400">Batch {l.batchNo} · Exp {l.expDate} · {l.unit}</div>
      </div>
    ) },
    { key: "qty", label: "Qty", align: "center" as const, render: (l: CartLine) => (
      <input type="number" min={0} step="any" value={l.qty} onChange={(e) => setQty(l.productId, num(e.target.value))}
        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm dark:border-slate-700 dark:bg-slate-800" />
    ) },
    { key: "rate", label: "Rate", align: "right" as const, render: (l: CartLine) => (
      <input type="number" step="any" value={l.rate} onChange={(e) => updateLine(l.batchId, l.productId, { rate: num(e.target.value) })}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
    ) },
    { key: "disc", label: "Disc %", align: "right" as const, render: (l: CartLine) => (
      <input type="number" step="any" min={0} max={100} value={l.discountPct} onChange={(e) => updateLine(l.batchId, l.productId, { discountPct: num(e.target.value) })}
        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
    ) },
    { key: "total", label: "Total", align: "right" as const, render: (l: CartLine) => {
      const lt = lineTotal(l.rate, l.qty, l.discountPct, l.taxPct);
      return <div className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">{fmtMoney(lt.total, sym)}</div>;
    } },
    { key: "act", label: "", align: "right" as const, render: (l: CartLine) => (
      <div className="flex justify-end gap-1">
        <IconBtn icon={<Layers className="size-4" />} label="Change batch" tone="primary" onClick={() => changeBatch(l.productId)} />
        <IconBtn icon={<Trash2 className="size-4" />} label="Remove" tone="danger" onClick={() => removeLine(l.batchId, l.productId)} />
      </div>
    ) },
  ];

  return (
    <Page
      title="Point of Sale"
      subtitle={`${todayISO()} · ${nowHM()} · Cashier: ${user?.name || "—"}`}
      actions={
        <Seg<PosView>
          value={view} onChange={setView}
          options={[{ value: "sale", label: "New Sale" }, { value: "receipts", label: "Receipts & Reprint" }]}
        />
      }
      wide
    >
      {errMsg && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          <span>{errMsg}</span>
          <IconBtn icon={<X className="size-4" />} label="Dismiss" onClick={() => setErrMsg(null)} />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        {/* ---------------- cart ---------------- */}
        <div className="xl:col-span-2">
          <Card title="Scan or search products" pad={false}
            actions={<div className="flex gap-2">
              <Btn variant="outline" size="sm" icon={<Search className="size-4" />} onClick={() => setShowSearch(true)}>Search (F2)</Btn>
              <Btn variant="outline" size="sm" icon={<FileSearch className="size-4" />} onClick={() => setView("receipts")}>Receipts (F8)</Btn>
            </div>}>
            <div className="p-4">
              <div className="relative">
                <ScanBarcode className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-indigo-500" />
                <input
                  ref={scanRef}
                  placeholder="Scan barcode or type product code / name…  (scanner works like a keyboard)"
                  className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50/40 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white dark:border-indigo-900 dark:bg-slate-800 dark:text-slate-100"
                  onKeyDown={(e) => { if (e.key === "Enter") { handleScan((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; } }}
                />
              </div>
            </div>
          </Card>

          <div className="mt-5">
            <Card title={`Cart (${lines.length} line${lines.length === 1 ? "" : "s"})`} pad={false}
              actions={<Btn variant="ghost" size="sm" icon={<RefreshCcw className="size-4" />} onClick={clearCart}>Clear</Btn>}>
              <TableX
                cols={lineCols}
                rows={lines}
                rowKey={(l) => l.batchId + l.productId}
                pageSize={100}
                empty="Cart is empty. Scan a barcode or search for a product to begin."
              />
            </Card>
          </div>
        </div>

        {/* ---------------- right column ---------------- */}
        <div className="space-y-5">
          <Card title="Customer">
            <div className="flex gap-2">
              <div className="flex-1">
                <Sel value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value={WALKIN_ID}>Walk-in Customer</option>
                  {db.customers.filter((c) => c.id !== WALKIN_ID).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ""}</option>
                  ))}
                </Sel>
              </div>
              <Btn variant="outline" icon={<UserRound className="size-4" />} onClick={() => navTo("customers")}>+</Btn>
            </div>
            {customer && customer.id !== WALKIN_ID && (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Receivable</span>
                <span className={`font-semibold ${customer.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtMoney(customer.balance, sym)}</span>
                {customer.creditLimit > 0 && <span className="text-slate-400">Limit {fmtMoney(customer.creditLimit, sym)}</span>}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["cash", "credit", "cash+credit", "card", "other"] as PayMethod[]).map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition-all active:scale-[0.97] ${
                    method === m
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400"
                  }`}>
                  {m === "cash" ? <Banknote className="size-4" /> : m === "credit" || m === "cash+credit" ? <ReceiptText className="size-4" /> : <CreditCard className="size-4" />}
                  {m}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Totals">
            <div className="space-y-2 text-sm">
              <Row k="Gross Total" v={fmtMoney(totals.gross, sym)} />
              <Row k="Item Discount" v={`− ${fmtMoney(totals.itemDisc, sym)}`} />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Receipt Discount %</span>
                <input type="number" min={0} max={100} step="any" value={receiptDiscPct} onChange={(e) => setReceiptDiscPct(num(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <Row k={`Receipt Discount (${fmtNum(receiptDiscPct)}%)`} v={`− ${fmtMoney(totals.receiptDisc, sym)}`} />
              <Row k="Sales Tax" v={fmtMoney(totals.tax, sym)} />
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Additional</span>
                <input type="number" min={0} step="any" value={additional} onChange={(e) => setAdditional(num(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Advance</span>
                <input type="number" min={0} step="any" value={advance} onChange={(e) => setAdvance(num(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-base font-bold text-slate-900 dark:text-white">Net Total</span>
                <span className="text-xl font-bold tabular-nums text-indigo-600">{fmtMoney(totals.net, sym)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950/40">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Paid</div>
                  <input type="number" min={0} step="any" value={paid} onChange={(e) => setPaid(num(e.target.value))}
                    className="w-full bg-transparent text-sm font-bold text-emerald-700 outline-none dark:text-emerald-300" />
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">Change</div>
                  <div className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">{fmtMoney(change, sym)}</div>
                </div>
              </div>
              {balance > 0 && (
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm dark:bg-rose-950/40">
                  <span className="text-rose-500 dark:text-rose-300">Balance due: </span>
                  <span className="font-bold text-rose-600 dark:text-rose-300">{fmtMoney(balance, sym)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Actions">
            <div className="grid grid-cols-2 gap-2">
              <Btn variant="dark" icon={<Plus className="size-4" />} onClick={clearCart}>New Sale (F1)</Btn>
              <Btn variant="outline" icon={<Pause className="size-4" />} onClick={doHold}>Hold (F4)</Btn>
              <Btn variant="outline" icon={<Undo2 className="size-4" />} onClick={() => setShowHolds(true)}>Retrieve (F5)</Btn>
              <Btn variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => setShowReturn(true)}>Return</Btn>
              <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => { if (lastSaleNo) { const s = db.sales.find((x) => x.no === lastSaleNo); if (s) print({ kind: "sale", data: s.id }); } else toastErr("No sale saved in this session yet."); }}>Print (F7)</Btn>
              <Btn variant="success" icon={<Save className="size-4" />} loading={busy} onClick={() => doSave(false)}>Save Sale</Btn>
            </div>
            <Btn variant="primary" className="mt-2 w-full" icon={<Printer className="size-4" />} loading={busy} onClick={() => doSave(true)}>
              Save &amp; Print Receipt
            </Btn>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-400 dark:bg-slate-800">
              <span><b className="text-slate-500 dark:text-slate-300">Shortcuts:</b> F1 new · F2 search · F4 hold · F5 retrieve · F7 print · F8 receipts · F9 payment · Ctrl+S save · Ctrl+P save &amp; print</span>
            </div>
          </Card>
        </div>
      </div>

      {/* product search modal */}
      <Modal open={showSearch} onClose={() => setShowSearch(false)} title="Search Products" subtitle="Type name, generic, barcode or code — click to add 1 unit, or double-click for qty 1. Use the + stepper after adding."
        size="xl">
        <Inp autoFocus placeholder="Search products…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        <div className="mt-4 max-h-[50vh] overflow-y-auto">
          <TableX
            cols={[
              { key: "name", label: "Product", render: (p: Product) => (<div><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.generic} · {p.brand}</div></div>) },
              { key: "code", label: "Code" },
              { key: "bc", label: "Barcode", render: (p: Product) => <span className="font-mono text-xs">{p.barcode || p.altBarcode || "—"}</span> },
              { key: "stock", label: "Stock", align: "right" as const, render: (p: Product) => <StockTag productId={p.id} /> },
              { key: "retail", label: "Retail", align: "right" as const, render: (p: Product) => <Money v={p.retailPrice} symbol={sym} /> },
              { key: "act", label: "", align: "right" as const, render: (p: Product) => <Btn size="sm" icon={<Plus className="size-4" />} onClick={() => { addProduct(p, 1); }}>Add</Btn> },
            ]}
            rows={db.products.filter((p) => {
              const q = searchQ.toLowerCase();
              return !q || p.name.toLowerCase().includes(q) || p.generic.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q) || p.altBarcode.includes(q) || p.brand.toLowerCase().includes(q);
            })}
            rowKey={(p) => p.id}
            pageSize={8}
            empty="No products match your search."
          />
        </div>
      </Modal>

      {/* batch picker */}
      {pending && (
        <BatchModal
          product={pending.product}
          qty={pending.qty}
          onClose={() => setPending(null)}
          onPick={(batchId) => {
            const { product, qty, replace } = pending;
            if (replace) {
              const rest = lines.filter((l) => l.productId !== product.id);
              if (batchId === "auto") {
                const alloc = allocateFEFO(db, product.id, qty, db.settings.security.allowExpiredSales);
                if (typeof alloc === "string") toastErr(alloc);
                else {
                  const next = [...rest];
                  for (const a of alloc) {
                    const bt = db.batches.find((b) => b.id === a.batchId)!;
                    next.push(makeLine(product, bt, a.qty));
                  }
                  setLines(next);
                }
              } else {
                const bt = db.batches.find((b) => b.id === batchId)!;
                if (bt.qty < qty) toastErr(`Insufficient stock in batch ${bt.batchNo}.`);
                else setLines([...rest, makeLine(product, bt, qty)]);
              }
            } else {
              addLine(product, batchId, qty, batchId === "auto");
            }
            setPending(null);
          }}
        />
      )}

      {/* payment modal */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Payment" subtitle={`Receipt total: ${fmtMoney(totals.net, sym)}`}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Payment Method">
            <Sel value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="cash+credit">Cash + Credit</option>
              <option value="card">Credit Card</option>
              <option value="other">Other</option>
            </Sel>
          </Field>
          <Field label="Paid Amount">
            <Num value={paid} onChange={(e) => setPaid(num(e.target.value))} min={0} />
          </Field>
          <Field label="Additional Amount">
            <Num value={additional} onChange={(e) => setAdditional(num(e.target.value))} min={0} />
          </Field>
          <Field label="Advance">
            <Num value={advance} onChange={(e) => setAdvance(num(e.target.value))} min={0} />
          </Field>
          <Field label="Receipt Discount %" className="col-span-2">
            <Num value={receiptDiscPct} onChange={(e) => setReceiptDiscPct(num(e.target.value))} min={0} max={100} />
          </Field>
          <Field label="Notes" className="col-span-2">
            <Inp value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note on the receipt" />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800">
          <span className="text-slate-500">Change: <b className="text-emerald-600">{fmtMoney(change, sym)}</b></span>
          <span className="text-slate-500">Balance: <b className="text-rose-600">{fmtMoney(balance, sym)}</b></span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="outline" onClick={() => setShowPay(false)}>Cancel (ESC)</Btn>
          <Btn variant="success" icon={<Save className="size-4" />} onClick={() => { setShowPay(false); doSave(false); }}>Save Sale</Btn>
          <Btn icon={<Printer className="size-4" />} onClick={() => { setShowPay(false); doSave(true); }}>Save &amp; Print</Btn>
        </div>
      </Modal>

      {/* holds */}
      <Modal open={showHolds} onClose={() => setShowHolds(false)} title="Held Sales" subtitle="Retrieve a held sale to continue where you left off.">
        {holds.length === 0 ? <Empty message="No held sales." /> : (
          <div className="space-y-2">
            {holds.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <div>
                  <div className="text-sm font-semibold">{s.no} <span className="ml-2 text-xs font-normal text-slate-400">{fmtDT(s.date, s.time)}</span></div>
                  <div className="text-xs text-slate-400">{s.items.length} items · {s.customerName} · {fmtMoney(s.net, sym)}</div>
                </div>
                <div className="flex gap-2">
                  <Btn size="sm" icon={<Undo2 className="size-4" />} onClick={() => {
                    setLines(s.items.map((i) => ({
                      productId: i.productId, productName: i.productName, generic: i.generic,
                      batchId: i.batchId, batchNo: i.batchNo, expDate: i.expDate, unit: i.unit,
                      rate: i.rate, qty: i.qty, discountPct: i.discountPct, taxPct: i.taxPct, cost: i.cost,
                    })));
                    setCustomerId(s.customerId);
                    setNotes(s.notes);
                    deleteHold(s.id);
                    setShowHolds(false);
                    setView("sale");
                  }}>Retrieve</Btn>
                  <IconBtn icon={<Trash2 className="size-4" />} label="Delete hold" tone="danger" onClick={() => deleteHold(s.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* return */}
      <ReturnModal open={showReturn} onClose={() => setShowReturn(false)} onDone={() => setShowReturn(false)} />
    </Page>
  );
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{k}</span>
      <span className="tabular-nums text-slate-700 dark:text-slate-200">{v}</span>
    </div>
  );
}

function StockTag({ productId }: { productId: string }) {
  const { db } = usePos();
  const st = stockOf(db, productId);
  const prod = db.products.find((p) => p.id === productId);
  const low = prod && prod.minStock > 0 && st < prod.minStock;
  return <span className={low ? "font-bold text-rose-600" : "text-slate-600 dark:text-slate-300"}>{fmtNum(st)}</span>;
}

function BatchModal({ product, qty, onClose, onPick }: {
  product: Product; qty: number; onClose: () => void; onPick: (batchId: string) => void;
}) {
  const { db } = usePos();
  const sym = db.settings.currency.symbol;
  const batches = availableBatches(db, product.id, db.settings.security.allowExpiredSales);
  const [sel, setSel] = useState<string>("auto");
  return (
    <Modal open onClose={onClose} title={`Select Batch — ${product.name}`} subtitle={`Quantity: ${fmtNum(qty)} · ${product.generic}`}>
      <div className="space-y-2">
        <label className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition ${sel === "auto" ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"}`}>
          <div className="flex items-center gap-3">
            <input type="radio" checked={sel === "auto"} onChange={() => setSel("auto")} />
            <div>
              <div className="text-sm font-semibold">Auto — First Expiry, First Out</div>
              <div className="text-xs text-slate-400">System picks the earliest-expiring batches</div>
            </div>
          </div>
          <Tag tone="violet">FEFO</Tag>
        </label>
        {batches.map((b) => {
          const info = expiryInfo(b, 30);
          const tone = info.tone === "red" ? "red" : info.tone === "amber" ? "amber" : info.tone === "yellow" ? "orange" : "green";
          return (
            <label key={b.id} className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition ${sel === b.id ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40" : "border-slate-200 hover:border-slate-300 dark:border-slate-700"}`}>
              <div className="flex items-center gap-3">
                <input type="radio" checked={sel === b.id} onChange={() => setSel(b.id)} />
                <div>
                  <div className="text-sm font-semibold">Batch {b.batchNo}</div>
                  <div className="text-xs text-slate-400">Exp {b.expDate} · {fmtNum(b.qty)} units · {fmtMoney(b.salePrice || product.retailPrice, sym)}</div>
                </div>
              </div>
              <Tag tone={tone as "red"}>{info.label}</Tag>
            </label>
          );
        })}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn icon={<Plus className="size-4" />} onClick={() => onPick(sel)}>Add to Sale</Btn>
      </div>
    </Modal>
  );
}

// ---------------- receipts & reprint ----------------
function ReceiptsView({ onBack, onReturn }: { onBack: () => void; onReturn: () => void }) {
  const { db, print } = usePos();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const sales = db.sales
    .filter((s) => s.status === "final")
    .filter((s) => {
      const t = q.toLowerCase();
      return !t || s.no.toLowerCase().includes(t) || s.customerName.toLowerCase().includes(t) || s.cashierName.toLowerCase().includes(t);
    })
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const detail = db.sales.find((s) => s.id === detailId);

  return (
    <Page title="Receipts & Reprint" subtitle="Search any saved receipt, reprint it, or process a return."
      actions={<Btn variant="outline" onClick={onBack} icon={<Plus className="size-4" />}>Back to Sale</Btn>} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Inp className="pl-9" placeholder="Search by receipt no, customer, cashier… (F8)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
        <Btn variant="outline" icon={<RotateCcw className="size-4" />} onClick={onReturn}>Process Return</Btn>
      </div>
      <Card pad={false}>
        <TableX
          cols={[
            { key: "no", label: "Receipt", sort: (r) => r.no, render: (r) => <span className="font-semibold">{r.no}</span> },
            { key: "dt", label: "Date", sort: (r) => r.date + r.time, render: (r) => <span className="text-xs">{fmtDT(r.date, r.time)}</span> },
            { key: "cust", label: "Customer", render: (r) => r.customerName },
            { key: "cashier", label: "Cashier", render: (r) => r.cashierName },
            { key: "items", label: "Items", align: "center", render: (r) => r.items.length },
            { key: "net", label: "Net", align: "right", render: (r) => <Money v={r.net} symbol={sym} /> },
            { key: "st", label: "Status", render: (r) => (r.returned ? <Tag tone="amber">Returned</Tag> : r.balance > 0 ? <Tag tone="blue">Due</Tag> : <Tag tone="green">Paid</Tag>) },
            { key: "act", label: "", align: "right", render: (r) => (
              <div className="flex justify-end gap-1">
                <Btn size="sm" variant="outline" icon={<Printer className="size-4" />} onClick={() => print({ kind: "sale", data: r.id })}>Print</Btn>
                <Btn size="sm" variant="ghost" onClick={() => setDetailId(r.id)}>View</Btn>
              </div>
            ) },
          ]}
          rows={sales}
          rowKey={(r) => r.id}
          pageSize={10}
          empty="No receipts found."
        />
      </Card>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title={`Receipt ${detail?.no || ""}`} subtitle={detail ? fmtDT(detail.date, detail.time) : ""} size="xl">
        {detail && (
          <div>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta k="Customer" v={detail.customerName} />
              <Meta k="Cashier" v={detail.cashierName} />
              <Meta k="Payment" v={detail.method} />
              <Meta k="Net Total" v={fmtMoney(detail.net, sym)} />
            </div>
            <TableX
              cols={[
                { key: "name", label: "Product", render: (i) => (<div><div className="font-medium">{i.productName}</div><div className="text-xs text-slate-400">Batch {i.batchNo} · Exp {i.expDate}</div></div>) },
                { key: "qty", label: "Qty", align: "center", render: (i) => fmtNum(i.qty) },
                { key: "rate", label: "Rate", align: "right", render: (i) => fmtMoney(i.rate, sym) },
                { key: "disc", label: "Disc", align: "right", render: (i) => fmtMoney(i.discount, sym) },
                { key: "tax", label: "Tax", align: "right", render: (i) => fmtMoney(i.tax, sym) },
                { key: "total", label: "Total", align: "right", render: (i) => <b>{fmtMoney(i.total, sym)}</b> },
              ]}
              rows={detail.items}
              rowKey={(i) => i.id}
              pageSize={20}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Btn variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => { setDetailId(null); onReturn(); }}>Return Items</Btn>
              <Btn icon={<Printer className="size-4" />} onClick={() => print({ kind: "sale", data: detail.id })}>Reprint</Btn>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{v}</div>
    </div>
  );
}

// ---------------- returns ----------------
function ReturnModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { db, returnSale, alreadyReturned } = usePos();
  const sym = db.settings.currency.symbol;
  const [saleId, setSaleId] = useState<string>("");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sales = db.sales.filter((s) => s.status === "final").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const sale = db.sales.find((s) => s.id === saleId);
  const maxQ = (itemId: string) => {
    const it = sale?.items.find((i) => i.id === itemId);
    return it ? it.qty - alreadyReturned(sale!, it.productId, it.batchId) : 0;
  };
  const total = sale
    ? round2(sale.items.reduce((s, it) => s + (qtyMap[it.id] || 0) * it.rate, 0))
    : 0;

  const submit = () => {
    if (!sale) { setError("Select a receipt."); return; }
    const lines = sale.items
      .filter((it) => (qtyMap[it.id] || 0) > 0)
      .map((it) => ({ productId: it.productId, batchId: it.batchId, qty: qtyMap[it.id] || 0 }));
    setBusy(true);
    setTimeout(() => {
      const err = returnSale(sale.id, lines, method, note);
      setBusy(false);
      if (err) setError(err);
      else { setSaleId(""); setQtyMap({}); setNote(""); setError(null); onDone(); }
    }, 150);
  };

  return (
    <Modal open={open} onClose={onClose} title="Sales Return" subtitle="Search a receipt, choose items and quantities. Stock and the customer account are reversed automatically." size="xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Receipt" required>
          <Sel value={saleId} onChange={(e) => { setSaleId(e.target.value); setQtyMap({}); }}>
            <option value="">— Select receipt —</option>
            {sales.map((s) => (
              <option key={s.id} value={s.id}>{s.no} · {fmtDT(s.date, s.time)} · {s.customerName} · {fmtMoney(s.net, sym)}</option>
            ))}
          </Sel>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Refund Method">
            <Sel value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Credit to Account</option>
              <option>Card</option>
              <option>Other</option>
            </Sel>
          </Field>
          <Field label="Notes">
            <Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" />
          </Field>
        </div>
      </div>

      {sale && (
        <div className="mt-4">
          <TableX
            cols={[
              { key: "name", label: "Product", render: (i) => (<div><div className="font-medium">{i.productName}</div><div className="text-xs text-slate-400">Batch {i.batchNo} · Exp {i.expDate}</div></div>) },
              { key: "sold", label: "Sold", align: "center", render: (i) => fmtNum(i.qty) },
              { key: "avail", label: "Returnable", align: "center", render: (i) => <span className="font-semibold">{fmtNum(maxQ(i.id))}</span> },
              { key: "rate", label: "Rate", align: "right", render: (i) => fmtMoney(i.rate, sym) },
              { key: "qty", label: "Qty to Return", align: "right", render: (i) => (
                <input type="number" min={0} max={maxQ(i.id)} step="any" value={qtyMap[i.id] || 0}
                  onChange={(e) => setQtyMap({ ...qtyMap, [i.id]: Math.min(maxQ(i.id), Math.max(0, num(e.target.value))) })}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm dark:border-slate-700 dark:bg-slate-800" />
              ) },
            ]}
            rows={sale.items}
            rowKey={(i) => i.id}
            pageSize={20}
            empty="No items."
          />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
            <span className="text-sm text-slate-500">Total refund</span>
            <span className="text-lg font-bold text-rose-600">{fmtMoney(total, sym)}</span>
          </div>
        </div>
      )}

      {error && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{error}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" loading={busy} icon={<RotateCcw className="size-4" />} onClick={submit}>Process Return &amp; Print</Btn>
      </div>
    </Modal>
  );
}
