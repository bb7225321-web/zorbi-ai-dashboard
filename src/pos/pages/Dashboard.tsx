import { useMemo } from "react";
import {
  Banknote, ShoppingCart, TrendingUp, Pill, AlertTriangle, CalendarClock, Ban,
  HandCoins, Wallet, Plus, PackagePlus, Boxes, BarChart3, Truck, Users,
  DatabaseBackup, Info, ArrowRight,
} from "lucide-react";
import { usePos } from "../store";
import { Page, Card, Stat, Tag, TableX, Btn, Money, Empty } from "../ui";
import { fmtMoney, fmtDT, fmtDate, todayISO, daysUntil, expiryInfo, stockOf, saleProfit, fmtNum } from "../core";

export function Dashboard() {
  const { db, user, navTo, backup } = usePos();
  const sym = db.settings.currency.symbol;

  const stats = useMemo(() => {
    const today = todayISO();
    const salesToday = db.sales.filter((s) => s.status === "final" && s.date === today);
    const salesTodayNet = salesToday.reduce((s, x) => s + x.net, 0);
    const salesTodayProfit = salesToday.reduce((s, x) => s + saleProfit(x), 0);
    const returnsToday = db.saleReturns.filter((r) => r.date === today);
    const returnsTodayProfit = returnsToday.reduce((s, r) => s + r.items.reduce((a, i) => a + (i.rate - i.cost) * i.qty, 0), 0);
    const purchasesToday = db.purchases.filter((p) => p.status === "final" && p.date === today).reduce((s, p) => s + p.total, 0);
    const batches = db.batches;
    const expired = batches.filter((b) => daysUntil(b.expDate) < 0).reduce((s, b) => s + b.qty, 0);
    const expiring = batches.filter((b) => { const d = daysUntil(b.expDate); return d >= 0 && d <= 7; });
    const lowStock = db.products.filter((p) => p.minStock > 0 && stockOf(db, p.id) < p.minStock);
    const receivables = db.customers.filter((c) => c.balance > 0.001).reduce((s, c) => s + c.balance, 0);
    const payables = db.suppliers.filter((s) => s.balance > 0.001).reduce((s2, s) => s2 + s.balance, 0);
    return { salesTodayNet, salesTodayProfit, returnsTodayProfit, purchasesToday, expired, expiring, lowStock, receivables, payables, salesCount: salesToday.length };
  }, [db]);

  const recentSales = useMemo(() =>
    [...db.sales].filter((s) => s.status === "final").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8),
  [db.sales]);

  const quick = [
    { label: "New Sale", icon: <Plus className="size-5" />, cls: "bg-indigo-600 text-white hover:bg-indigo-500", go: () => navTo("pos") },
    { label: "New Purchase", icon: <PackagePlus className="size-5" />, cls: "bg-emerald-600 text-white hover:bg-emerald-500", go: () => navTo("purchases", { new: true }) },
    { label: "Add Product", icon: <Boxes className="size-5" />, cls: "bg-violet-600 text-white hover:bg-violet-500", go: () => navTo("products", { new: true }) },
    { label: "Stock Report", icon: <BarChart3 className="size-5" />, cls: "bg-sky-600 text-white hover:bg-sky-500", go: () => navTo("reports", { report: "stock" }) },
    { label: "Expiry Report", icon: <CalendarClock className="size-5" />, cls: "bg-amber-500 text-white hover:bg-amber-400", go: () => navTo("reports", { report: "expiry" }) },
    { label: "Sales Report", icon: <TrendingUp className="size-5" />, cls: "bg-cyan-600 text-white hover:bg-cyan-500", go: () => navTo("reports", { report: "sales" }) },
    { label: "Purchase Report", icon: <Truck className="size-5" />, cls: "bg-teal-600 text-white hover:bg-teal-500", go: () => navTo("reports", { report: "purchases" }) },
    { label: "Customers", icon: <Users className="size-5" />, cls: "bg-blue-600 text-white hover:bg-blue-500", go: () => navTo("customers") },
    { label: "Suppliers", icon: <HandCoins className="size-5" />, cls: "bg-fuchsia-600 text-white hover:bg-fuchsia-500", go: () => navTo("suppliers") },
    { label: "Backup", icon: <DatabaseBackup className="size-5" />, cls: "bg-slate-700 text-white hover:bg-slate-600", go: () => backup() },
  ];

  return (
    <Page
      title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${user?.name.split(" ")[0] || "User"} 👋`}
      subtitle={`${fmtDate(todayISO())} · Here is what is happening in your pharmacy today.`}
      actions={<Tag tone="blue">{user ? user.role.toUpperCase() : ""} ACCESS</Tag>}
      wide
    >
      {db.demo && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Info className="size-4 shrink-0" />
          <span><b>DEMO DATA</b> — the database contains sample medicines, batches and transactions so you can test every workflow. Go to <b>Settings → Database</b> to reset or restore a real backup.</span>
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Stat icon={<Banknote className="size-5" />} label="Today's Sales" value={<Money v={stats.salesTodayNet} symbol={sym} />} sub={`${stats.salesCount} receipts`} tone={{ bg: "bg-indigo-50 text-indigo-600", bar: "bg-indigo-500" }} onClick={() => navTo("reports", { report: "sales" })} />
        <Stat icon={<TrendingUp className="size-5" />} label="Today's Profit" value={<Money v={stats.salesTodayProfit - stats.returnsTodayProfit} symbol={sym} />} sub="After returns" tone={{ bg: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" }} onClick={() => navTo("reports", { report: "profit" })} />
        <Stat icon={<ShoppingCart className="size-5" />} label="Today's Purchases" value={<Money v={stats.purchasesToday} symbol={sym} />} sub="Goods received" tone={{ bg: "bg-sky-50 text-sky-600", bar: "bg-sky-500" }} onClick={() => navTo("reports", { report: "purchases" })} />
        <Stat icon={<Pill className="size-5" />} label="Total Products" value={db.products.length} sub={`${db.batches.length} batches · ${fmtNum(db.batches.reduce((s, b) => s + b.qty, 0))} units`} tone={{ bg: "bg-violet-50 text-violet-600", bar: "bg-violet-500" }} onClick={() => navTo("inventory")} />
        <Stat icon={<AlertTriangle className="size-5" />} label="Low Stock" value={stats.lowStock.length} sub="Below minimum" tone={{ bg: "bg-amber-50 text-amber-600", bar: "bg-amber-500" }} onClick={() => navTo("inventory", { filter: "low" })} />
        <Stat icon={<CalendarClock className="size-5" />} label="Expiring ≤ 7d" value={stats.expiring.length} sub="Batches" tone={{ bg: "bg-orange-50 text-orange-600", bar: "bg-orange-500" }} onClick={() => navTo("inventory", { filter: "expiring" })} />
        <Stat icon={<Ban className="size-5" />} label="Expired Units" value={fmtNum(stats.expired)} sub="Cannot be sold" tone={{ bg: "bg-rose-50 text-rose-600", bar: "bg-rose-500" }} onClick={() => navTo("inventory", { filter: "expired" })} />
        <Stat icon={<HandCoins className="size-5" />} label="Customer Receivables" value={<Money v={stats.receivables} symbol={sym} />} sub={`${db.customers.filter((c) => c.balance > 0.001).length} customers`} tone={{ bg: "bg-blue-50 text-blue-600", bar: "bg-blue-500" }} onClick={() => navTo("customers")} />
        <Stat icon={<Wallet className="size-5" />} label="Supplier Payables" value={<Money v={stats.payables} symbol={sym} />} sub={`${db.suppliers.filter((s) => s.balance > 0.001).length} suppliers`} tone={{ bg: "bg-fuchsia-50 text-fuchsia-600", bar: "bg-fuchsia-500" }} onClick={() => navTo("suppliers")} />
      </div>

      {/* quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quick.map((q) => (
          <button key={q.label} type="button" onClick={q.go}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${q.cls}`}>
            {q.icon}
            <span className="flex-1 text-left">{q.label}</span>
            <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {/* alerts */}
        <Card title="Alerts & Expiry Watch" pad={false}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.lowStock.length === 0 && stats.expiring.length === 0 && (
              <div className="p-4"><Empty message="No alerts — stock levels are healthy." /></div>
            )}
            {stats.lowStock.length > 0 && (
              <button type="button" className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-amber-50/60 dark:hover:bg-slate-800/60" onClick={() => navTo("inventory", { filter: "low" })}>
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle className="size-4" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">LOW STOCK: {stats.lowStock.length} PRODUCTS</div>
                    <div className="text-xs text-slate-400">Below minimum stock level</div>
                  </div>
                </div>
                <ArrowRight className="size-4 text-slate-300" />
              </button>
            )}
            {stats.expiring.map((b) => {
              const prod = db.products.find((x) => x.id === b.productId);
              const info = expiryInfo(b, db.settings.inventory.expiryWarningDays);
              return (
                <div key={b.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-xl ${info.tone === "red" ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"}`}>
                      <CalendarClock className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{prod?.name || "?"}</div>
                      <div className="text-xs text-slate-400">Batch {b.batchNo} · {fmtNum(b.qty)} units · Exp {b.expDate}</div>
                    </div>
                  </div>
                  <Tag tone={info.tone === "red" ? "red" : "orange"}>{info.label}</Tag>
                </div>
              );
            })}
          </div>
        </Card>

        {/* recent sales */}
        <Card title="Recent Sales" pad={false} className="xl:col-span-2"
          actions={<Btn variant="ghost" size="sm" onClick={() => navTo("pos", { view: "receipts" })}>View receipts →</Btn>}>
          <TableX
            cols={[
              { key: "no", label: "Receipt", sort: (r) => r.no },
              { key: "dt", label: "Date", sort: (r) => r.date + r.time, render: (r) => <span className="text-xs">{fmtDT(r.date, r.time)}</span> },
              { key: "cust", label: "Customer", render: (r) => r.customerName },
              { key: "items", label: "Items", align: "center", render: (r) => r.items.length },
              { key: "net", label: "Net", align: "right", render: (r) => <Money v={r.net} symbol={sym} /> },
              { key: "pay", label: "Payment", render: (r) => <Tag tone={r.method === "cash" ? "green" : "violet"}>{r.method}</Tag> },
              { key: "st", label: "Status", render: (r) => (r.returned ? <Tag tone="amber">Partial return</Tag> : r.balance > 0 ? <Tag tone="blue">Due</Tag> : <Tag tone="green">Paid</Tag>) },
            ]}
            rows={recentSales}
            rowKey={(r) => r.id}
            pageSize={8}
            empty="No sales recorded yet."
          />
        </Card>
      </div>
    </Page>
  );
}
