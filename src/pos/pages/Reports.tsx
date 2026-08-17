import { useEffect, useMemo, useState } from "react";
import { Printer, Download, FileBarChart2 } from "lucide-react";
import { usePos } from "../store";
import { Page, Card, Btn, Inp, Sel, Empty } from "../ui";
import {
  DB, fmtMoney, fmtDate, fmtNum, todayISO, addDays, round2, daysUntil, expiryInfo, stockOf, toCsv, download,
} from "../core";

type ReportId =
  | "sales" | "saleReturns" | "salesDiscount" | "purchases" | "purchaseReturns" | "purchaseDiscount"
  | "stock" | "lowStock" | "expiry" | "profit" | "tax"
  | "cLedger" | "sLedger" | "customerCredit" | "supplierBalance"
  | "expenses" | "income" | "cash";

const GROUPS: { group: string; items: { id: ReportId; label: string }[] }[] = [
  { group: "Sales", items: [
    { id: "sales", label: "Sales Report" },
    { id: "salesDiscount", label: "Sales Discount Report" },
    { id: "saleReturns", label: "Sales Return Report" },
    { id: "profit", label: "Profit Report" },
    { id: "tax", label: "Tax Report" },
  ] },
  { group: "Purchases", items: [
    { id: "purchases", label: "Purchase Report" },
    { id: "purchaseDiscount", label: "Purchase Discount Report" },
    { id: "purchaseReturns", label: "Purchase Return Report" },
  ] },
  { group: "Stock", items: [
    { id: "stock", label: "Stock Report" },
    { id: "lowStock", label: "Low Stock Report" },
    { id: "expiry", label: "Expiry Report" },
  ] },
  { group: "Ledgers", items: [
    { id: "cLedger", label: "Customer Ledger" },
    { id: "sLedger", label: "Supplier Ledger" },
    { id: "customerCredit", label: "Customer Credit Report" },
    { id: "supplierBalance", label: "Supplier Balance Report" },
  ] },
  { group: "Money", items: [
    { id: "expenses", label: "Expense Report" },
    { id: "income", label: "Income Report" },
    { id: "cash", label: "Cash Report" },
  ] },
];

interface Rep {
  cols: string[];
  rows: (string | number)[][];
  totals?: string[];
}

export function Reports() {
  const { db, routeData, print } = usePos();
  const sym = db.settings.currency.symbol;
  const [id, setId] = useState<ReportId>("sales");
  const [from, setFrom] = useState(addDays(todayISO(), -30));
  const [to, setTo] = useState(todayISO());
  const [group, setGroup] = useState<"day" | "product" | "category" | "customer" | "cashier">("day");

  useEffect(() => {
    const d = routeData as { report?: ReportId } | null;
    if (d?.report && GROUPS.some((g) => g.items.some((i) => i.id === d.report))) setId(d.report);
  }, [routeData]);

  const rep = useMemo<Rep>(() => buildReport(db, id, from, to, group, sym), [db, id, from, to, group, sym]);
  const title = GROUPS.flatMap((g) => g.items).find((i) => i.id === id)?.label || "";

  const exportCsv = () => {
    download(`${id}-${from}-to-${to}.csv`, toCsv([rep.cols, ...rep.rows]), "text/csv");
  };
  const printIt = () => {
    print({
      kind: "report",
      data: {
        title: title.toUpperCase() + " REPORT",
        meta: [["Period", `${fmtDate(from)} — ${fmtDate(to)}`], ["Generated", todayISO()], ["Records", String(rep.rows.length)]],
        cols: rep.cols, rows: rep.rows, totals: rep.totals,
      },
    });
  };

  return (
    <Page title="Reports" subtitle="Every report is computed live from the database — filter, print, or export."
      actions={<Btn variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>Export CSV</Btn>} wide>
      <div className="grid gap-5 lg:grid-cols-4">
        <Card pad={false} className="h-fit lg:sticky lg:top-20">
          <div className="p-3">
            {GROUPS.map((g) => (
              <div key={g.group} className="mb-3">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{g.group}</div>
                {g.items.map((i) => (
                  <button key={i.id} type="button" onClick={() => setId(i.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      id === i.id ? "bg-indigo-600 font-semibold text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}>
                    <FileBarChart2 className="size-4 opacity-70" />
                    {i.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3">
          <Card title={title}
            actions={<div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                From <Inp type="date" className="w-36 py-1.5 text-xs" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500">
                To <Inp type="date" className="w-36 py-1.5 text-xs" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
              </label>
              {(id === "sales" || id === "purchases") && (
                <Sel className="w-40 py-1.5 text-xs" value={group} onChange={(e) => setGroup(e.target.value as typeof group)}>
                  <option value="day">By day</option>
                  {id === "sales" && <option value="product">By product</option>}
                  {id === "sales" && <option value="category">By category</option>}
                  {id === "sales" && <option value="customer">By customer</option>}
                  {id === "sales" && <option value="cashier">By cashier</option>}
                </Sel>
              )}
              <Btn size="sm" variant="outline" icon={<Printer className="size-4" />} onClick={printIt}>Print</Btn>
            </div>} pad={false}>
            <div className="overflow-x-auto p-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {rep.cols.map((c, i) => (
                      <th key={c + i} className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 ${i > 0 ? "text-right" : "text-left"}`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rep.rows.map((r, ri) => (
                    <tr key={ri} className="border-b border-slate-100 transition-colors odd:bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800 dark:odd:bg-slate-800/30 dark:hover:bg-slate-800/60">
                      {r.map((c, ci) => (
                        <td key={ci} className={`px-3 py-2 tabular-nums ${ci > 0 ? "text-right" : "text-left"}`}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {rep.totals && (
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold dark:border-slate-700 dark:bg-slate-800">
                      {rep.totals.map((t, ti) => <td key={ti} className={`px-3 py-2.5 tabular-nums ${ti > 0 ? "text-right" : "text-left"}`}>{t}</td>)}
                    </tr>
                  </tfoot>
                )}
              </table>
              {!rep.rows.length && <Empty message="No records in this period." />}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

function buildReport(db: DB, id: ReportId, from: string, to: string, group: string, sym: string): Rep {
  const inRange = (d: string) => d >= from && d <= to;
  const m = (n: number) => fmtMoney(n, sym);
  const n = (x: number) => fmtNum(x);

  switch (id) {
    case "sales": {
      const sales = db.sales.filter((s) => s.status === "final" && inRange(s.date));
      if (group === "day") {
        const map = new Map<string, { c: number; items: number; gross: number; disc: number; tax: number; net: number }>();
        for (const s of sales) {
          const e = map.get(s.date) || { c: 0, items: 0, gross: 0, disc: 0, tax: 0, net: 0 };
          e.c++; e.items += s.items.length; e.gross += s.gross; e.disc += s.itemDisc + s.receiptDisc; e.tax += s.tax; e.net += s.net;
          map.set(s.date, e);
        }
        const rows = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, e]) => [fmtDate(d), n(e.c), n(e.items), m(e.gross), m(e.disc), m(e.tax), m(e.net)]);
        return { cols: ["Date", "Receipts", "Items", "Gross", "Discounts", "Tax", "Net"], rows, totals: ["Total", n(sales.length), n(sales.reduce((s, x) => s + x.items.length, 0)), m(sales.reduce((s, x) => s + x.gross, 0)), m(sales.reduce((s, x) => s + x.itemDisc + x.receiptDisc, 0)), m(sales.reduce((s, x) => s + x.tax, 0)), m(sales.reduce((s, x) => s + x.net, 0))] };
      }
      if (group === "cashier") {
        const map = new Map<string, { c: number; net: number }>();
        for (const s of sales) { const e = map.get(s.cashierName) || { c: 0, net: 0 }; e.c++; e.net += s.net; map.set(s.cashierName, e); }
        const rows = [...map.entries()].map(([k, e]) => [k, n(e.c), m(e.net)]);
        return { cols: ["Cashier", "Receipts", "Net"], rows, totals: ["Total", n(sales.length), m(sales.reduce((s, x) => s + x.net, 0))] };
      }
      if (group === "customer") {
        const map = new Map<string, { c: number; net: number; paid: number }>();
        for (const s of sales) { const e = map.get(s.customerName) || { c: 0, net: 0, paid: 0 }; e.c++; e.net += s.net; e.paid += s.paid; map.set(s.customerName, e); }
        const rows = [...map.entries()].map(([k, e]) => [k, n(e.c), m(e.net), m(e.paid), m(round2(e.net - e.paid))]);
        return { cols: ["Customer", "Receipts", "Net", "Paid", "Balance"], rows, totals: ["Total", n(sales.length), m(sales.reduce((s, x) => s + x.net, 0)), m(sales.reduce((s, x) => s + x.paid, 0)), m(sales.reduce((s, x) => s + x.balance, 0))] };
      }
      if (group === "product") {
        const map = new Map<string, { q: number; rev: number; disc: number; tax: number; cost: number }>();
        for (const s of sales) for (const i of s.items) {
          const e = map.get(i.productName) || { q: 0, rev: 0, disc: 0, tax: 0, cost: 0 };
          e.q += i.qty; e.rev += i.rate * i.qty; e.disc += i.discount; e.tax += i.tax; e.cost += i.cost * i.qty;
          map.set(i.productName, e);
        }
        const rows = [...map.entries()].map(([k, e]) => [k, n(e.q), m(e.rev), m(e.disc), m(e.tax), m(round2(e.rev - e.disc - e.cost)), m(round2(e.rev - e.disc + e.tax - e.cost))]);
        return { cols: ["Product", "Qty", "Revenue", "Discount", "Tax", "Gross Profit", "Net"], rows, totals: ["Total", n([...map.values()].reduce((s, e) => s + e.q, 0)), m([...map.values()].reduce((s, e) => s + e.rev, 0)), m([...map.values()].reduce((s, e) => s + e.disc, 0)), m([...map.values()].reduce((s, e) => s + e.tax, 0)), m([...map.values()].reduce((s, e) => s + e.rev - e.disc - e.cost, 0)), m([...map.values()].reduce((s, e) => s + e.rev - e.disc + e.tax - e.cost, 0))] };
      }
      // category
      const map = new Map<string, { q: number; rev: number; cost: number }>();
      for (const s of sales) for (const i of s.items) {
        const p = db.products.find((x) => x.id === i.productId);
        const cat = p?.category || "Uncategorised";
        const e = map.get(cat) || { q: 0, rev: 0, cost: 0 };
        e.q += i.qty; e.rev += i.rate * i.qty; e.cost += i.cost * i.qty;
        map.set(cat, e);
      }
      const rows = [...map.entries()].map(([k, e]) => [k, n(e.q), m(e.rev), m(e.cost), m(round2(e.rev - e.cost))]);
      return { cols: ["Category", "Qty", "Revenue", "Cost", "Profit"], rows, totals: ["Total", n([...map.values()].reduce((s, e) => s + e.q, 0)), m([...map.values()].reduce((s, e) => s + e.rev, 0)), m([...map.values()].reduce((s, e) => s + e.cost, 0)), m([...map.values()].reduce((s, e) => s + e.rev - e.cost, 0))] };
    }
    case "salesDiscount": {
      const sales = db.sales.filter((s) => s.status === "final" && inRange(s.date));
      const rows = sales.map((s) => [s.no, fmtDate(s.date), s.customerName, s.cashierName, n(s.gross), n(s.itemDisc), n(s.receiptDisc), m(s.itemDisc + s.receiptDisc)]);
      return {
        cols: ["Receipt", "Date", "Customer", "Cashier", "Gross", "Item Disc", "Receipt Disc", "Total Discount"], rows,
        totals: ["Total", "", "", "", m(sales.reduce((s2, x) => s2 + x.gross, 0)), m(sales.reduce((s2, x) => s2 + x.itemDisc, 0)), m(sales.reduce((s2, x) => s2 + x.receiptDisc, 0)), m(sales.reduce((s2, x) => s2 + x.itemDisc + x.receiptDisc, 0))],
      };
    }
    case "saleReturns": {
      const rs = db.saleReturns.filter((r) => inRange(r.date));
      const rows = rs.map((r) => [r.no, fmtDate(r.date), r.saleNo, r.customerName, n(r.items.length), m(r.total), r.method]);
      return { cols: ["Return No", "Date", "Receipt", "Customer", "Items", "Total", "Refund"], rows, totals: ["Total", "", "", "", "", m(rs.reduce((s, r) => s + r.total, 0)), ""] };
    }
    case "purchases": {
      const ps = db.purchases.filter((p) => p.status === "final" && inRange(p.date));
      if (group === "day") {
        const map = new Map<string, { c: number; items: number; sub: number; total: number }>();
        for (const p of ps) { const e = map.get(p.date) || { c: 0, items: 0, sub: 0, total: 0 }; e.c++; e.items += p.items.length; e.sub += p.subTotal; e.total += p.total; map.set(p.date, e); }
        const rows = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, e]) => [fmtDate(d), n(e.c), n(e.items), m(e.sub), m(e.total)]);
        return { cols: ["Date", "Invoices", "Items", "Sub Total", "Total"], rows, totals: ["Total", n(ps.length), n(ps.reduce((s, p) => s + p.items.length, 0)), m(ps.reduce((s, p) => s + p.subTotal, 0)), m(ps.reduce((s, p) => s + p.total, 0))] };
      }
      const map = new Map<string, { c: number; total: number }>();
      for (const p of ps) { const e = map.get(p.supplierName) || { c: 0, total: 0 }; e.c++; e.total += p.total; map.set(p.supplierName, e); }
      const rows = [...map.entries()].map(([k, e]) => [k, n(e.c), m(e.total)]);
      return { cols: ["Supplier", "Invoices", "Total"], rows, totals: ["Total", n(ps.length), m(ps.reduce((s, p) => s + p.total, 0))] };
    }
    case "purchaseDiscount": {
      const ps = db.purchases.filter((p) => p.status === "final" && inRange(p.date));
      const rows = ps.map((p) => [p.no, fmtDate(p.date), p.supplierName, n(p.subTotal), n(p.discount), m(p.total)]);
      return {
        cols: ["Invoice", "Date", "Supplier", "Sub Total", "Purchase Discount", "Net Total"], rows,
        totals: ["Total", "", "", m(ps.reduce((s, p) => s + p.subTotal, 0)), m(ps.reduce((s, p) => s + p.discount, 0)), m(ps.reduce((s, p) => s + p.total, 0))],
      };
    }
    case "purchaseReturns": {
      const rs = db.purchaseReturns.filter((r) => inRange(r.date));
      const rows = rs.map((r) => [r.no, fmtDate(r.date), r.purchaseNo, r.supplierName, n(r.items.length), m(r.total)]);
      return { cols: ["Return No", "Date", "Purchase", "Supplier", "Items", "Total"], rows, totals: ["Total", "", "", "", "", m(rs.reduce((s, r) => s + r.total, 0))] };
    }
    case "stock": {
      const rows = db.batches.map((b) => {
        const p = db.products.find((x) => x.id === b.productId);
        return [p?.code || "", p?.name || "", b.batchNo, b.expDate, n(b.qty), m(b.cost), m(b.salePrice), m(round2(b.qty * b.cost)), db.suppliers.find((s) => s.id === b.supplierId)?.name || ""];
      });
      const val = db.batches.reduce((s, b) => s + b.qty * b.cost, 0);
      return { cols: ["Code", "Product", "Batch", "Expiry", "Qty", "Cost", "Retail", "Value", "Supplier"], rows, totals: ["", "", "", "", "", "", "", m(val), ""] };
    }
    case "lowStock": {
      const rows = db.products.filter((p) => p.minStock > 0 && stockOf(db, p.id) < p.minStock).map((p) => [p.code, p.name, n(stockOf(db, p.id)), n(p.minStock), n(p.optStock), n(p.maxStock), db.suppliers.find((s) => s.id === p.supplierId)?.name || ""]);
      return { cols: ["Code", "Product", "Stock", "Minimum", "Optimal", "Maximum", "Supplier"], rows, totals: ["", "", "", "", "", "", ""] };
    }
    case "expiry": {
      const rows = db.batches.map((b) => {
        const p = db.products.find((x) => x.id === b.productId);
        const info = expiryInfo(b, db.settings.inventory.expiryWarningDays);
        const d = daysUntil(b.expDate);
        return [p?.name || "", b.batchNo, b.expDate, n(b.qty), info.label, d < 0 ? "Expired" : d <= 7 ? "Expiring ≤ 7d" : d <= 30 ? "≤ 30d" : d <= 90 ? "≤ 90d" : "OK"];
      });
      return { cols: ["Product", "Batch", "Expiry", "Qty", "Days left", "Status"], rows, totals: ["", "", "", n(db.batches.reduce((s, b) => s + b.qty, 0)), "", ""] };
    }
    case "profit": {
      const sales = db.sales.filter((s) => s.status === "final" && inRange(s.date));
      const returns = db.saleReturns.filter((r) => inRange(r.date));
      const rev = sales.reduce((s, x) => s + x.net, 0);
      const cost = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cost * i.qty, 0), 0);
      const gross = sales.reduce((s, x) => s + saleProfit(x), 0);
      const discs = sales.reduce((s, x) => s + x.itemDisc + x.receiptDisc, 0);
      const taxes = sales.reduce((s, x) => s + x.tax, 0);
      const retTotal = returns.reduce((s, r) => s + r.total, 0);
      const retCost = returns.reduce((s, r) => s + r.items.reduce((a, i) => a + i.cost * i.qty, 0), 0);
      const map = new Map<string, { rev: number; cost: number; disc: number; tax: number; ret: number }>();
      for (const s of sales) { const e = map.get(s.date) || { rev: 0, cost: 0, disc: 0, tax: 0, ret: 0 }; e.rev += s.net; e.cost += s.items.reduce((a, i) => a + i.cost * i.qty, 0); e.disc += s.itemDisc + s.receiptDisc; e.tax += s.tax; map.set(s.date, e); }
      for (const r of returns) { const e = map.get(r.date) || { rev: 0, cost: 0, disc: 0, tax: 0, ret: 0 }; e.ret += r.total; map.set(r.date, e); }
      const rows = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, e]) => [fmtDate(d), m(e.rev), m(e.cost), m(round2(e.rev - e.cost)), m(e.disc), m(e.tax), m(e.ret), m(round2(e.rev - e.cost - e.disc - e.ret))]);
      return {
        cols: ["Date", "Revenue", "COGS", "Gross Profit", "Discounts", "Tax", "Returns", "Net Profit"], rows,
        totals: ["Total", m(rev), m(cost), m(round2(rev - cost)), m(discs), m(taxes), m(retTotal), m(round2(gross - discs - retTotal + retCost))],
      };
    }
    case "tax": {
      const sales = db.sales.filter((s) => s.status === "final" && inRange(s.date));
      const map = new Map<string, { c: number; tax: number }>();
      for (const s of sales) { const e = map.get(s.date) || { c: 0, tax: 0 }; e.c++; e.tax += s.tax; map.set(s.date, e); }
      const rows = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([d, e]) => [fmtDate(d), n(e.c), m(e.tax)]);
      return { cols: ["Date", "Receipts", "Sales Tax Collected"], rows, totals: ["Total", n(sales.length), m(sales.reduce((s, x) => s + x.tax, 0))] };
    }
    case "cLedger": {
      const es = db.cLedger.filter((e) => inRange(e.date));
      const rows = es.map((e) => [fmtDate(e.date), e.partyName, e.ref, e.type, e.debit ? m(e.debit) : "", e.credit ? m(e.credit) : "", m(e.balance)]);
      return { cols: ["Date", "Customer", "Ref", "Type", "Debit", "Credit", "Balance"], rows, totals: ["Total", "", "", "", m(es.reduce((s, e) => s + e.debit, 0)), m(es.reduce((s, e) => s + e.credit, 0)), ""] };
    }
    case "sLedger": {
      const es = db.sLedger.filter((e) => inRange(e.date));
      const rows = es.map((e) => [fmtDate(e.date), e.partyName, e.ref, e.type, e.debit ? m(e.debit) : "", e.credit ? m(e.credit) : "", m(e.balance)]);
      return { cols: ["Date", "Supplier", "Ref", "Type", "Debit", "Credit", "Balance"], rows, totals: ["Total", "", "", "", m(es.reduce((s, e) => s + e.debit, 0)), m(es.reduce((s, e) => s + e.credit, 0)), ""] };
    }
    case "customerCredit": {
      const rows = db.customers
        .filter((c) => c.id !== "walkin")
        .map((c) => [c.name, c.phone || "—", m(c.creditLimit), m(c.balance), m(Math.max(0, c.creditLimit - c.balance)), c.balance > c.creditLimit && c.creditLimit > 0 ? "Over limit" : c.balance > 0 ? "Outstanding" : "Clear"]);
      return { cols: ["Customer", "Phone", "Credit Limit", "Current Balance", "Available", "Status"], rows, totals: ["Total", "", m(db.customers.reduce((s, c) => s + c.creditLimit, 0)), m(db.customers.reduce((s, c) => s + Math.max(0, c.balance), 0)), "", ""] };
    }
    case "supplierBalance": {
      const rows = db.suppliers.map((s) => [s.name, s.contactPerson || "—", s.phone || "—", m(s.balance), s.balance > 0 ? "Payable" : s.balance < 0 ? "Advance" : "Clear"]);
      return { cols: ["Supplier", "Contact", "Phone", "Current Payable", "Status"], rows, totals: ["Total", "", "", m(db.suppliers.reduce((s, x) => s + Math.max(0, x.balance), 0)), ""] };
    }
    case "expenses": {
      const es = db.expenses.filter((e) => inRange(e.date));
      const rows = es.map((e) => [fmtDate(e.date), e.category, e.description || "—", m(e.amount), e.method]);
      return { cols: ["Date", "Category", "Description", "Amount", "Method"], rows, totals: ["Total", "", "", m(es.reduce((s, e) => s + e.amount, 0)), ""] };
    }
    case "income": {
      const es = db.incomes.filter((e) => inRange(e.date));
      const rows = es.map((e) => [fmtDate(e.date), e.type, e.description || "—", m(e.amount), e.method]);
      return { cols: ["Date", "Type", "Description", "Amount", "Method"], rows, totals: ["Total", "", "", m(es.reduce((s, e) => s + e.amount, 0)), ""] };
    }
    case "cash": {
      const es = db.cash.filter((e) => inRange(e.date));
      const rows = es.map((e) => [fmtDate(e.date), e.desc, e.in ? m(e.in) : "", e.out ? m(e.out) : "", m(e.balance)]);
      return { cols: ["Date", "Description", "Cash In", "Cash Out", "Balance"], rows, totals: ["Total", "", m(es.reduce((s, e) => s + e.in, 0)), m(es.reduce((s, e) => s + e.out, 0)), ""] };
    }
  }
}

function saleProfit(s: DB["sales"][number]): number {
  return s.items.reduce((t, i) => t + round2(i.rate * i.qty - i.discount - i.cost * i.qty), 0);
}
