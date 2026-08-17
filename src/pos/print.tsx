// ============================================================================
// ZB SOFTWARE — Pharmacy POS & Inventory System — print preview & printing (uses the OS print dialog)
// ============================================================================
import { useState } from "react";
import { Printer, X, FileDown } from "lucide-react";
import { usePos, type PrintPayload } from "./store";
import { PAPER_SIZES, fmtMoney, fmtDate, fmtDT, fmtNum, round2, APP_NAME, APP_SUBTITLE } from "./core";
import { escapeHtml, labelHTML } from "./barcode";
import { Btn, IconBtn, Sel, Num } from "./ui";
import { printLogoHTML } from "./logo";

const esc = escapeHtml;

function docHeader(db: ReturnType<typeof usePos>["db"], opts: { paper: string; copies: number; title: string; subtitle?: string }) {
  const ph = db.settings.pharmacy;
  const showLogo = db.settings.receipt.showLogo;
  const logo = showLogo ? `<div class="pp-logo">${printLogoHTML(44, ph.name, ph.logo)}</div>` : "";
  return `
  <div class="pp-head">
    ${logo}
    <div class="pp-brand">${esc(APP_NAME)}</div>
    <div class="pp-muted" style="text-transform:uppercase;font-size:0.8em;letter-spacing:1px;">${esc(APP_SUBTITLE)}</div>
    <div class="pp-store">${esc(ph.name)}</div>
    ${ph.address ? `<div>${esc(ph.address)}</div>` : ""}
    ${ph.phone ? `<div>Phone: ${esc(ph.phone)}</div>` : ""}
    ${ph.email ? `<div>${esc(ph.email)}</div>` : ""}
    ${ph.license ? `<div class="pp-muted">License: ${esc(ph.license)}</div>` : ""}
    <div class="pp-rule"></div>
    <div class="pp-title">${esc(opts.title)}</div>
    ${opts.subtitle ? `<div class="pp-muted">${esc(opts.subtitle)}</div>` : ""}
    ${db.settings.receipt.header ? `<div class="pp-muted">${esc(db.settings.receipt.header)}</div>` : ""}
  </div>`;
}

function docFooter(db: ReturnType<typeof usePos>["db"]) {
  const foot = db.settings.receipt.footer || db.settings.pharmacy.footer;
  return `<div class="pp-foot">
    <div class="pp-rule"></div>
    <div>${esc(foot)}</div>
    <div class="pp-thanks">Thank you for shopping with us. Get well soon!</div>
  </div>`;
}

export function saleHTML(db: ReturnType<typeof usePos>["db"], saleId: string): string {
  const sale = db.sales.find((s) => s.id === saleId);
  if (!sale) return "<p>Receipt not found.</p>";
  const sym = db.settings.currency.symbol;
  const rows = sale.items
    .map((i) => `<tr>
      <td>${esc(i.productName)}<div class="pp-muted">Batch: ${esc(i.batchNo)} · Exp: ${esc(i.expDate)}</div></td>
      <td class="pp-r">${fmtNum(i.qty)}</td>
      <td class="pp-r">${fmtMoney(i.rate, sym)}</td>
      <td class="pp-r">${fmtMoney(i.discount, sym)}</td>
      <td class="pp-r">${fmtMoney(i.tax, sym)}</td>
      <td class="pp-r">${fmtMoney(i.total, sym)}</td>
    </tr>`).join("");
  return `
    ${docHeader(db, { paper: "", copies: 1, title: `SALES RECEIPT`, subtitle: `Receipt No: ${sale.no}` })}
    <table class="pp-meta">
      <tr><td>Date:</td><td class="pp-r">${fmtDT(sale.date, sale.time)}</td></tr>
      <tr><td>Cashier:</td><td class="pp-r">${esc(sale.cashierName)}</td></tr>
      <tr><td>Customer:</td><td class="pp-r">${esc(sale.customerName)}</td></tr>
      ${sale.customerPhone ? `<tr><td>Phone:</td><td class="pp-r">${esc(sale.customerPhone)}</td></tr>` : ""}
      <tr><td>Payment:</td><td class="pp-r">${esc(sale.method)}</td></tr>
    </table>
    <table class="pp-items">
      <thead><tr><th>Item</th><th class="pp-r">Qty</th><th class="pp-r">Rate</th><th class="pp-r">Disc</th><th class="pp-r">Tax</th><th class="pp-r">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="pp-totals">
      <tr><td>Gross Total</td><td class="pp-r">${fmtMoney(sale.gross, sym)}</td></tr>
      <tr><td>Item Discount</td><td class="pp-r">${fmtMoney(sale.itemDisc, sym)}</td></tr>
      <tr><td>Receipt Discount (${sale.receiptDiscType === "amt" ? fmtMoney(sale.receiptDiscValue, sym) : fmtNum(sale.receiptDiscValue) + "%"})</td><td class="pp-r">${fmtMoney(sale.receiptDisc, sym)}</td></tr>
      <tr><td>Sales Tax</td><td class="pp-r">${fmtMoney(sale.tax, sym)}</td></tr>
      <tr><td>Additional Amount</td><td class="pp-r">${fmtMoney(sale.additional, sym)}</td></tr>
      <tr><td>Advance</td><td class="pp-r">${fmtMoney(sale.advance, sym)}</td></tr>
      <tr class="pp-net"><td>NET TOTAL</td><td class="pp-r">${fmtMoney(sale.net, sym)}</td></tr>
      <tr><td>Paid Amount</td><td class="pp-r">${fmtMoney(sale.paid, sym)}</td></tr>
      <tr><td>Change</td><td class="pp-r">${fmtMoney(sale.change, sym)}</td></tr>
      ${sale.balance > 0 ? `<tr><td>Balance Due</td><td class="pp-r">${fmtMoney(sale.balance, sym)}</td></tr>` : ""}
    </table>
    ${docFooter(db)}`;
}

export function purchaseHTML(db: ReturnType<typeof usePos>["db"], purchaseId: string): string {
  const p = db.purchases.find((x) => x.id === purchaseId);
  if (!p) return "<p>Invoice not found.</p>";
  const sym = db.settings.currency.symbol;
  const rows = p.items.map((i) => `<tr>
    <td>${esc(i.productName)}<div class="pp-muted">Batch: ${esc(i.batchNo)} · Exp: ${esc(i.expDate)}</div></td>
    <td class="pp-r">${fmtNum(i.qty)}${i.freeQty ? ` + ${fmtNum(i.freeQty)}` : ""}</td>
    <td class="pp-r">${fmtMoney(i.cost, sym)}</td>
    <td class="pp-r">${fmtMoney(i.retail, sym)}</td>
    <td class="pp-r">${fmtMoney(i.discount, sym)}</td>
    <td class="pp-r">${fmtMoney(i.total, sym)}</td>
  </tr>`).join("");
  return `
    ${docHeader(db, { paper: "", copies: 1, title: "PURCHASE INVOICE", subtitle: `Invoice No: ${p.no}` })}
    <table class="pp-meta">
      <tr><td>Date:</td><td class="pp-r">${fmtDT(p.date, p.time)}</td></tr>
      <tr><td>Supplier:</td><td class="pp-r">${esc(p.supplierName)}</td></tr>
      <tr><td>Supplier Invoice:</td><td class="pp-r">${esc(p.invoiceNo)}</td></tr>
      <tr><td>Bill No:</td><td class="pp-r">${esc(p.billNo)}</td></tr>
      <tr><td>Due Date:</td><td class="pp-r">${p.dueDate ? fmtDate(p.dueDate) : "—"}</td></tr>
      <tr><td>Payment Mode:</td><td class="pp-r">${esc(p.mode)}</td></tr>
    </table>
    <table class="pp-items">
      <thead><tr><th>Item</th><th class="pp-r">Qty</th><th class="pp-r">Cost</th><th class="pp-r">Retail</th><th class="pp-r">Disc</th><th class="pp-r">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="pp-totals">
      <tr><td>Sub Total</td><td class="pp-r">${fmtMoney(p.subTotal, sym)}</td></tr>
      <tr><td>Purchase Discount (${p.discountType === "amt" ? fmtMoney(p.discountValue, sym) : fmtNum(p.discountValue) + "%"})</td><td class="pp-r">${fmtMoney(p.discount, sym)}</td></tr>
      <tr><td>Loading Expense</td><td class="pp-r">${fmtMoney(p.loading, sym)}</td></tr>
      <tr><td>Freight Expense</td><td class="pp-r">${fmtMoney(p.freight, sym)}</td></tr>
      <tr><td>Other Expense</td><td class="pp-r">${fmtMoney(p.other, sym)}</td></tr>
      <tr><td>Additional Amount</td><td class="pp-r">${fmtMoney(p.additional, sym)}</td></tr>
      <tr><td>Purchase Tax</td><td class="pp-r">${fmtMoney(p.tax, sym)}</td></tr>
      <tr><td>Advance Tax</td><td class="pp-r">${fmtMoney(p.advanceTax, sym)}</td></tr>
      <tr><td>Withholding Tax</td><td class="pp-r">${fmtMoney(p.withTax, sym)}</td></tr>
      <tr class="pp-net"><td>TOTAL AMOUNT</td><td class="pp-r">${fmtMoney(p.total, sym)}</td></tr>
    </table>
    ${p.comments ? `<div class="pp-muted">Notes: ${esc(p.comments)}</div>` : ""}
    ${docFooter(db)}`;
}

export function returnHTML(db: ReturnType<typeof usePos>["db"], kind: "saleReturn" | "purchaseReturn", id: string): string {
  const sym = db.settings.currency.symbol;
  if (kind === "saleReturn") {
    const r = db.saleReturns.find((x) => x.id === id);
    if (!r) return "<p>Return not found.</p>";
    const rows = r.items.map((i) => `<tr>
      <td>${esc(i.productName)}<div class="pp-muted">Batch: ${esc(i.batchNo)} · Exp: ${esc(i.expDate)}</div></td>
      <td class="pp-r">${fmtNum(i.qty)}</td>
      <td class="pp-r">${fmtMoney(i.rate, sym)}</td>
      <td class="pp-r">${fmtMoney(i.total, sym)}</td>
    </tr>`).join("");
    return `
      ${docHeader(db, { paper: "", copies: 1, title: "SALES RETURN", subtitle: `Return No: ${r.no}` })}
      <table class="pp-meta">
        <tr><td>Date:</td><td class="pp-r">${fmtDate(r.date)}</td></tr>
        <tr><td>Original Receipt:</td><td class="pp-r">${esc(r.saleNo)}</td></tr>
        <tr><td>Customer:</td><td class="pp-r">${esc(r.customerName)}</td></tr>
        <tr><td>Refund Method:</td><td class="pp-r">${esc(r.method)}</td></tr>
      </table>
      <table class="pp-items">
        <thead><tr><th>Item</th><th class="pp-r">Qty</th><th class="pp-r">Rate</th><th class="pp-r">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <table class="pp-totals">
        <tr class="pp-net"><td>REFUND TOTAL</td><td class="pp-r">${fmtMoney(r.total, sym)}</td></tr>
      </table>
      ${r.note ? `<div class="pp-muted">Notes: ${esc(r.note)}</div>` : ""}
      ${docFooter(db)}`;
  }
  const r = db.purchaseReturns.find((x) => x.id === id);
  if (!r) return "<p>Return not found.</p>";
  const rows = r.items.map((i) => `<tr>
    <td>${esc(i.productName)}<div class="pp-muted">Batch: ${esc(i.batchNo)}</div></td>
    <td class="pp-r">${fmtNum(i.qty)}</td>
    <td class="pp-r">${fmtMoney(i.cost, sym)}</td>
    <td class="pp-r">${fmtMoney(i.total, sym)}</td>
  </tr>`).join("");
  return `
    ${docHeader(db, { paper: "", copies: 1, title: "PURCHASE RETURN", subtitle: `Return No: ${r.no}` })}
    <table class="pp-meta">
      <tr><td>Date:</td><td class="pp-r">${fmtDate(r.date)}</td></tr>
      <tr><td>Original Purchase:</td><td class="pp-r">${esc(r.purchaseNo)}</td></tr>
      <tr><td>Supplier:</td><td class="pp-r">${esc(r.supplierName)}</td></tr>
    </table>
    <table class="pp-items">
      <thead><tr><th>Item</th><th class="pp-r">Qty</th><th class="pp-r">Cost</th><th class="pp-r">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="pp-totals">
      <tr class="pp-net"><td>RETURN TOTAL</td><td class="pp-r">${fmtMoney(r.total, sym)}</td></tr>
    </table>
    ${docFooter(db)}`;
}

export function statementHTML(db: ReturnType<typeof usePos>["db"], kind: "c" | "s", partyId: string): string {
  const sym = db.settings.currency.symbol;
  const party = kind === "c" ? db.customers.find((x) => x.id === partyId) : db.suppliers.find((x) => x.id === partyId);
  if (!party) return "<p>Party not found.</p>";
  const ledger = kind === "c" ? db.cLedger : db.sLedger;
  const entries = ledger.filter((e) => e.partyId === partyId);
  const opening = party.openingBalance;
  let bal = opening;
  const rows = entries.map((e) => {
    bal = round2(bal + e.debit - e.credit);
    return `<tr>
      <td>${fmtDate(e.date)}</td><td>${esc(e.ref)}</td><td>${esc(e.type)}</td>
      <td class="pp-r">${e.debit ? fmtMoney(e.debit, sym) : ""}</td>
      <td class="pp-r">${e.credit ? fmtMoney(e.credit, sym) : ""}</td>
      <td class="pp-r">${fmtMoney(bal, sym)}</td>
    </tr>`;
  }).join("");
  const title = kind === "c" ? "CUSTOMER STATEMENT" : "SUPPLIER STATEMENT";
  return `
    ${docHeader(db, { paper: "", copies: 1, title, subtitle: party.name })}
    <table class="pp-meta">
      <tr><td>Party:</td><td class="pp-r">${esc(party.name)}</td></tr>
      <tr><td>Phone:</td><td class="pp-r">${esc(party.phone)}</td></tr>
      ${kind === "c" ? `<tr><td>Credit Limit:</td><td class="pp-r">${fmtMoney((party as typeof db.customers[number]).creditLimit, sym)}</td></tr>` : ""}
      <tr><td>Opening Balance:</td><td class="pp-r">${fmtMoney(opening, sym)}</td></tr>
      <tr><td>Current ${kind === "c" ? "Receivable" : "Payable"}:</td><td class="pp-r">${fmtMoney(party.balance, sym)}</td></tr>
    </table>
    <table class="pp-items">
      <thead><tr><th>Date</th><th>Ref</th><th>Type</th><th class="pp-r">Debit</th><th class="pp-r">Credit</th><th class="pp-r">Balance</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" class="pp-r">No entries</td></tr>`}</tbody>
    </table>
    ${docFooter(db)}`;
}

export function reportHTML(db: ReturnType<typeof usePos>["db"], data: {
  title: string; meta: [string, string][]; cols: string[]; rows: (string | number)[][]; totals?: string[];
}): string {
  const thead = data.cols.map((c) => `<th>${esc(c)}</th>`).join("");
  const tbody = data.rows
    .map((r) => `<tr>${r.map((c) => `<td class="${typeof c === "number" ? "pp-r" : ""}">${esc(String(c))}</td>`).join("")}</tr>`)
    .join("");
  const meta = data.meta.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="pp-r">${esc(v)}</td></tr>`).join("");
  const totals = data.totals
    ? `<tfoot><tr>${data.totals.map((t, i) => `<td class="pp-r ${i === 0 ? "pp-total-first" : ""}">${esc(t)}</td>`).join("")}</tr></tfoot>`
    : "";
  return `
    ${docHeader(db, { paper: "", copies: 1, title: data.title })}
    <table class="pp-meta">${meta}</table>
    <table class="pp-items">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
      ${totals}
    </table>
    ${docFooter(db)}`;
}

export function labelPrintHTML(db: ReturnType<typeof usePos>["db"], labels: { name: string; price: string; barcode: string; extra?: string }[]): string {
  return `<div class="pp-labels">${labelHTML(labels, db.settings.currency.symbol)}</div>`;
}

// ---------------------------------------------------------------------------
export function PrintPortal() {
  const { printState, closePrint, db } = usePos();
  const [paper, setPaper] = useState<string>(db.settings.receipt.paper);
  const [copies, setCopies] = useState<number>(db.settings.receipt.copies);

  if (!printState) return null;
  const p = printState;

  const body = buildBody(db, p);
  const sizes = paper === "58mm" ? "pp-58mm" : paper === "80mm" ? "pp-80mm" : paper === "A4" ? "pp-A4" : "pp-A5";
  const block = `<div class="pp-page ${sizes}">${body}</div>`;
  const blocks = Array.from({ length: Math.max(1, copies) }, () => block).join('<div class="pp-break"></div>');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) closePrint(); }}>
      <div className="flex items-center gap-3 border-b border-slate-700/50 bg-slate-900 px-4 py-3">
        <Printer className="size-5 text-indigo-300" />
        <span className="text-sm font-semibold text-white">Print Preview</span>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            Paper
            <select value={paper} onChange={(e) => setPaper(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none">
              {PAPER_SIZES.map((s) => <option key={s} value={s}>{s === "58mm" ? "Thermal 58mm" : s === "80mm" ? "Thermal 80mm" : `A4 / A5 — ${s}`}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            Copies
            <input type="number" min={1} max={10} value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="w-16 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none" />
          </label>
          <Btn variant="outline" className="border-slate-600 bg-slate-800 text-white hover:bg-slate-700" icon={<FileDown className="size-4" />} onClick={() => window.print()}>
            Print / Save as PDF
          </Btn>
          <Btn variant="primary" icon={<Printer className="size-4" />} onClick={() => window.print()}>Print</Btn>
          <IconBtn icon={<X className="size-4" />} label="Close preview" onClick={closePrint} />
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-200/70 p-6 dark:bg-slate-950">
        <div id="print-root" className="mx-auto w-fit" dangerouslySetInnerHTML={{ __html: blocks }} />
      </div>
      <p className="border-t border-slate-700/50 bg-slate-900 px-4 py-2 text-[11px] text-slate-400">
        The preview renders exactly what will be sent to the selected printer. PRINT sends the document to your printer through the system print dialog (choose the thermal or A4 device there); you can also save as PDF.
      </p>
    </div>
  );
}

function buildBody(db: ReturnType<typeof usePos>["db"], p: PrintPayload): string {
  switch (p.kind) {
    case "sale": return saleHTML(db, String(p.data));
    case "purchase": return purchaseHTML(db, String(p.data));
    case "saleReturn":
    case "purchaseReturn": return returnHTML(db, p.kind, String(p.data));
    case "statement": {
      const d = p.data as { kind: "c" | "s"; partyId: string };
      return statementHTML(db, d.kind, d.partyId);
    }
    case "report": return reportHTML(db, p.data as Parameters<typeof reportHTML>[1]);
    case "labels": return labelPrintHTML(db, p.data as { name: string; price: string; barcode: string; extra?: string }[]);
    case "product": {
      const prod = db.products.find((x) => x.id === String(p.data));
      if (!prod) return "<p>Product not found.</p>";
      return labelPrintHTML(db, [{ name: prod.name, price: fmtMoney(prod.retailPrice, db.settings.currency.symbol), barcode: prod.barcode || prod.code, extra: `${prod.generic} · ${fmtMoney(prod.retailPrice, db.settings.currency.symbol)}` }]);
    }
  }
}
