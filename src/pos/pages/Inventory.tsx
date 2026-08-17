import { useEffect, useMemo, useState } from "react";
import { Search, Printer, Download, RefreshCcw, History, AlertTriangle, Ban } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Tag, Money, TableX, Seg } from "../ui";
import { fmtMoney, fmtNum, daysUntil, expiryInfo, stockOf, todayISO, toCsv, download, round2 } from "../core";
import { Product } from "../core";

type ExpFilter = "all" | "expired" | "expiring" | "near" | "ok";

export function Inventory() {
  const { db, routeData, adjustStock, print } = usePos();
  const sym = db.settings.currency.symbol;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sup, setSup] = useState("all");
  const [expF, setExpF] = useState<ExpFilter>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [adj, setAdj] = useState<{ batchId: string; delta: string; reason: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const d = routeData as { filter?: string } | null;
    if (d?.filter === "low") setLowOnly(true);
    if (d?.filter === "expired") setExpF("expired");
    if (d?.filter === "expiring") setExpF("expiring");
  }, [routeData]);

  const cats = useMemo(() => [...new Set(db.products.map((p) => p.category).filter(Boolean))].sort(), [db.products]);

  const rows = useMemo(() => {
    return db.batches
      .map((b) => {
        const p = db.products.find((x) => x.id === b.productId);
        const info = expiryInfo(b, db.settings.inventory.expiryWarningDays);
        return { b, p, info };
      })
      .filter(({ b, p, info }) => {
        const t = q.toLowerCase();
        const okQ = !t || (p?.name.toLowerCase().includes(t) || p?.code.toLowerCase().includes(t) || b.batchNo.toLowerCase().includes(t) || p?.barcode.includes(t));
        const okC = cat === "all" || p?.category === cat;
        const okS = sup === "all" || b.supplierId === sup;
        const okE =
          expF === "all" ? true :
          expF === "expired" ? info.tone === "red" && daysUntil(b.expDate) < 0 :
          expF === "expiring" ? info.tone === "red" && daysUntil(b.expDate) >= 0 :
          expF === "near" ? (info.tone === "amber" || info.tone === "yellow") :
          info.tone === "green";
        const okL = !lowOnly || (p ? p.minStock > 0 && stockOf(db, p.id) < p.minStock : false);
        return okQ && okC && okS && okE && okL;
      })
      .sort((a, b) => a.b.expDate.localeCompare(b.b.expDate));
  }, [db, q, cat, sup, expF, lowOnly]);

  const totalValue = rows.reduce((s, r) => s + r.b.qty * r.b.cost, 0);

  const exportCsv = () => {
    const head = ["Code", "Product", "Batch", "Expiry", "Qty", "Cost", "Retail", "Value", "Supplier", "Rack"];
    const body = rows.map(({ b, p }) => [
      p?.code || "", p?.name || "", b.batchNo, b.expDate, b.qty, b.cost, b.salePrice, round2(b.qty * b.cost),
      db.suppliers.find((s) => s.id === b.supplierId)?.name || "", p?.location || "",
    ]);
    download(`stock-${todayISO()}.csv`, toCsv([head, ...body]), "text/csv");
  };

  const printReport = (kind: "stock" | "expiry") => {
    const cols = kind === "stock"
      ? ["Code", "Product", "Batch", "Expiry", "Qty", "Cost", "Retail", "Value", "Supplier"]
      : ["Product", "Batch", "Expiry", "Qty", "Status"];
    const rowsArr = rows.map(({ b, p, info }) =>
      kind === "stock"
        ? [p?.code || "", p?.name || "", b.batchNo, b.expDate, fmtNum(b.qty), fmtMoney(b.cost, sym), fmtMoney(b.salePrice, sym), fmtMoney(round2(b.qty * b.cost), sym), db.suppliers.find((s) => s.id === b.supplierId)?.name || ""]
        : [p?.name || "", b.batchNo, b.expDate, fmtNum(b.qty), info.label],
    );
    print({
      kind: "report",
      data: {
        title: kind === "stock" ? "STOCK REPORT" : "EXPIRY REPORT",
        meta: [["Date", todayISO()], ["Records", String(rowsArr.length)], ["Filter", expF === "all" ? "All batches" : expF]],
        cols, rows: rowsArr,
        totals: kind === "stock" ? ["", "", "", "", "", "", "", fmtMoney(totalValue, sym), ""] : undefined,
      },
    });
  };

  const history = [...db.adjustments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Page
      title="Inventory / Stock"
      subtitle={`${db.batches.length} batches · ${fmtNum(db.batches.reduce((s, b) => s + b.qty, 0))} units · stock value ${fmtMoney(db.batches.reduce((s, b) => s + b.qty * b.cost, 0), sym)}`}
      actions={
        <>
          <Btn variant="outline" icon={<History className="size-4" />} onClick={() => setShowHistory(true)}>Adjustments</Btn>
          <Btn variant="outline" icon={<Download className="size-4" />} onClick={exportCsv}>Export CSV</Btn>
          <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => printReport("stock")}>Print Stock</Btn>
          <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => printReport("expiry")}>Print Expiry</Btn>
        </>
      }
      wide
    >
      <Card pad={false}
        actions={
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Inp className="w-60 pl-9" placeholder="Search product, batch, code…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Sel className="w-40" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
            <Sel className="w-44" value={sup} onChange={(e) => setSup(e.target.value)}>
              <option value="all">All suppliers</option>
              {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Sel>
            <Seg<ExpFilter> value={expF} onChange={setExpF} options={[
              { value: "all", label: "All" },
              { value: "expired", label: "Expired" },
              { value: "expiring", label: "≤ 7 days" },
              { value: "near", label: "≤ 30/60d" },
              { value: "ok", label: "OK" },
            ]} />
            <button type="button" onClick={() => setLowOnly(!lowOnly)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${lowOnly ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}>
              <AlertTriangle className="size-3.5" /> Low stock only
            </button>
          </div>
        }>
        <TableX
          cols={[
            { key: "prod", label: "Product", render: ({ p }: Row) => (<div><div className="font-medium">{p?.name || "—"}</div><div className="text-xs text-slate-400">{p?.code} · {p?.generic}</div></div>) },
            { key: "batch", label: "Batch", render: ({ b }: Row) => <span className="font-mono text-xs">{b.batchNo}</span> },
            { key: "exp", label: "Expiry", sort: ({ b }: Row) => b.expDate, render: ({ b, info }: Row) => {
              const tone = info.tone === "red" ? "red" : info.tone === "amber" ? "amber" : info.tone === "yellow" ? "orange" : "green";
              return <div className="flex items-center gap-2"><span className="text-xs">{b.expDate}</span><Tag tone={tone as "red"}>{info.label}</Tag></div>;
            } },
            { key: "qty", label: "Qty", align: "right", sort: ({ b }: Row) => b.qty, render: ({ b, p }: Row) => {
              const low = p && p.minStock > 0 && stockOf(db, p.id) < p.minStock;
              return <b className={low ? "text-amber-600" : ""}>{fmtNum(b.qty)}</b>;
            } },
            { key: "cost", label: "Cost", align: "right", render: ({ b }: Row) => fmtMoney(b.cost, sym) },
            { key: "retail", label: "Retail", align: "right", render: ({ b }: Row) => fmtMoney(b.salePrice, sym) },
            { key: "val", label: "Value", align: "right", sort: ({ b }: Row) => b.qty * b.cost, render: ({ b }: Row) => fmtMoney(round2(b.qty * b.cost), sym) },
            { key: "sup", label: "Supplier", render: ({ b }: Row) => db.suppliers.find((s) => s.id === b.supplierId)?.name || "—" },
            { key: "rack", label: "Rack", render: ({ p }: Row) => p?.location || "—" },
            { key: "act", label: "", align: "right", render: ({ b }: Row) => (
              <IconBtn icon={<RefreshCcw className="size-4" />} label="Adjust stock" tone="primary" onClick={() => setAdj({ batchId: b.id, delta: "0", reason: "" })} />
            ) },
          ]}
          rows={rows}
          rowKey={({ b }) => b.id}
          pageSize={12}
          rowClass={({ b, info }) => (daysUntil(b.expDate) < 0 ? "bg-rose-50/60 dark:bg-rose-950/20" : "")}
          empty="No stock records match the filters."
        />
      </Card>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Tag tone="red"><Ban className="size-3" /> Expired</Tag>
        <Tag tone="red">Expiring ≤ 7d</Tag>
        <Tag tone="amber">≤ 30d</Tag>
        <Tag tone="orange">≤ 60/90d</Tag>
        <Tag tone="green">OK</Tag>
        <span>· Red row = expired batch · Amber qty = below minimum</span>
      </div>

      {adj && (
        <Modal open onClose={() => setAdj(null)} title="Stock Adjustment" subtitle={`${db.batches.find((b) => b.id === adj.batchId)?.batchNo || ""} · current ${fmtNum(db.batches.find((b) => b.id === adj.batchId)?.qty || 0)} units`} size="sm"
          footer={
            <>
              <Btn variant="outline" onClick={() => setAdj(null)}>Cancel</Btn>
              <Btn variant="warn" icon={<RefreshCcw className="size-4" />} onClick={() => {
                const b = db.batches.find((x) => x.id === adj.batchId);
                if (!b) return;
                const e = adjustStock(b.productId, adj.batchId, num(adj.delta), adj.reason || "Manual adjustment");
                if (e) toast.error(e);
                setAdj(null);
              }}>Apply</Btn>
            </>
          }>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Delta (+ / −)" required><Num value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} /></Field>
            <Field label="Reason" required><Inp value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="e.g. Breakage, expiry, count" /></Field>
          </div>
          <p className="mt-3 text-xs text-slate-400">An audit record is created for every adjustment.</p>
        </Modal>
      )}

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title="Stock Adjustment History" size="xl">
        <TableX
          cols={[
            { key: "dt", label: "Date", sort: (a) => a.date, render: (a) => <span className="text-xs">{a.date}</span> },
            { key: "prod", label: "Product", render: (a) => a.productName },
            { key: "batch", label: "Batch", render: (a) => <span className="font-mono text-xs">{a.batchNo}</span> },
            { key: "delta", label: "Delta", align: "right", render: (a) => <b className={a.delta < 0 ? "text-rose-600" : "text-emerald-600"}>{a.delta > 0 ? "+" : ""}{fmtNum(a.delta)}</b> },
            { key: "reason", label: "Reason" },
            { key: "user", label: "User", render: (a) => a.userName },
          ]}
          rows={history}
          rowKey={(a) => a.id}
          pageSize={10}
          empty="No adjustments yet."
        />
      </Modal>
    </Page>
  );
}

type Row = { b: ReturnType<typeof usePos>["db"]["batches"][number]; p?: Product; info: ReturnType<typeof expiryInfo> };
function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
