import { useMemo, useState } from "react";
import { Plus, Trash2, Printer, Download, Save, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Tag, Money, Empty, TableX, Seg } from "../ui";
import { fmtMoney, fmtDate, todayISO, toCsv, download, EXPENSE_CATS, INCOME_TYPES, PAY_METHODS, Expense, Income } from "../core";

type Tab = "cl" | "sl" | "cash" | "exp" | "inc";

export function Accounts() {
  const { db, print, addExpense, deleteExpense, addIncome, deleteIncome, confirm } = usePos();
  const sym = db.settings.currency.symbol;
  const [tab, setTab] = useState<Tab>("cl");
  const [partyId, setPartyId] = useState("");
  const [expOpen, setExpOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);

  const expenses = useMemo(() => [...db.expenses].sort((a, b) => b.date.localeCompare(a.date)), [db.expenses]);
  const incomes = useMemo(() => [...db.incomes].sort((a, b) => b.date.localeCompare(a.date)), [db.incomes]);

  const printJournal = (kind: "exp" | "inc") => {
    const rows = (kind === "exp" ? expenses : incomes).map((e) => [
      e.date, kind === "exp" ? (e as Expense).category : (e as Income).type, e.description, fmtMoney(e.amount, sym), e.method, e.note,
    ]);
    print({
      kind: "report",
      data: {
        title: kind === "exp" ? "EXPENSE REPORT" : "INCOME REPORT",
        meta: [["Date", todayISO()], ["Records", String(rows.length)]],
        cols: ["Date", kind === "exp" ? "Category" : "Type", "Description", "Amount", "Method", "Notes"],
        rows,
        totals: kind === "exp"
          ? [`Total`, "", "", fmtMoney(expenses.reduce((s, e) => s + e.amount, 0), sym), "", ""]
          : [`Total`, "", "", fmtMoney(incomes.reduce((s, e) => s + e.amount, 0), sym), "", ""],
      },
    });
  };

  const csvJournal = (kind: "exp" | "inc") => {
    const rows = (kind === "exp" ? expenses : incomes).map((e) => [e.date, kind === "exp" ? (e as Expense).category : (e as Income).type, e.description, e.amount, e.method, e.note]);
    download(`${kind === "exp" ? "expenses" : "income"}-${todayISO()}.csv`, toCsv([["Date", "Category", "Description", "Amount", "Method", "Notes"], ...rows]), "text/csv");
  };

  const cashIn = db.cash.reduce((s, e) => s + e.in, 0);
  const cashOut = db.cash.reduce((s, e) => s + e.out, 0);
  const cashBal = db.cash.length ? db.cash[db.cash.length - 1].balance : 0;

  const customerLedger = db.cLedger.filter((e) => !partyId || e.partyId === partyId).sort((a, b) => (a.date + a.ref).localeCompare(b.date + b.ref));
  const supplierLedger = db.sLedger.filter((e) => !partyId || e.partyId === partyId).sort((a, b) => (a.date + a.ref).localeCompare(b.date + b.ref));

  return (
    <Page
      title="Accounts & Ledgers"
      subtitle="Customer ledgers, supplier ledgers, cash book, expenses and income."
      actions={<Seg<Tab> value={tab} onChange={setTab} options={[
        { value: "cl", label: "Customer Ledger" },
        { value: "sl", label: "Supplier Ledger" },
        { value: "cash", label: "Cash Book" },
        { value: "exp", label: "Expenses" },
        { value: "inc", label: "Income" },
      ]} />}
      wide
    >
      {tab === "cl" && (
        <Card pad={false}
          actions={<div className="p-3"><Sel className="w-64" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">All customers</option>
            {db.customers.filter((c) => c.id !== "walkin").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel></div>}>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
              { key: "party", label: "Customer", render: (e) => e.partyName },
              { key: "ref", label: "Ref", render: (e) => <span className="font-mono text-xs">{e.ref}</span> },
              { key: "type", label: "Type", render: (e) => <Tag tone={e.type === "invoice" ? "blue" : e.type === "payment" ? "green" : e.type === "return" ? "amber" : "slate"}>{e.type}</Tag> },
              { key: "debit", label: "Debit", align: "right", render: (e) => <span className={e.debit ? "text-rose-600" : ""}>{e.debit ? fmtMoney(e.debit, sym) : ""}</span> },
              { key: "credit", label: "Credit", align: "right", render: (e) => <span className={e.credit ? "text-emerald-600" : ""}>{e.credit ? fmtMoney(e.credit, sym) : ""}</span> },
              { key: "bal", label: "Balance", align: "right", render: (e) => <b>{fmtMoney(e.balance, sym)}</b> },
            ]}
            rows={customerLedger}
            rowKey={(e) => e.id}
            pageSize={15}
            empty="No customer ledger entries."
          />
        </Card>
      )}

      {tab === "sl" && (
        <Card pad={false}
          actions={<div className="p-3"><Sel className="w-64" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
            <option value="">All suppliers</option>
            {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Sel></div>}>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
              { key: "party", label: "Supplier", render: (e) => e.partyName },
              { key: "ref", label: "Ref", render: (e) => <span className="font-mono text-xs">{e.ref}</span> },
              { key: "type", label: "Type", render: (e) => <Tag tone={e.type === "invoice" ? "violet" : e.type === "payment" ? "green" : e.type === "return" ? "amber" : "slate"}>{e.type}</Tag> },
              { key: "debit", label: "Debit", align: "right", render: (e) => <span className={e.debit ? "text-emerald-600" : ""}>{e.debit ? fmtMoney(e.debit, sym) : ""}</span> },
              { key: "credit", label: "Credit", align: "right", render: (e) => <span className={e.credit ? "text-rose-600" : ""}>{e.credit ? fmtMoney(e.credit, sym) : ""}</span> },
              { key: "bal", label: "Balance", align: "right", render: (e) => <b>{fmtMoney(e.balance, sym)}</b> },
            ]}
            rows={supplierLedger}
            rowKey={(e) => e.id}
            pageSize={15}
            empty="No supplier ledger entries."
          />
        </Card>
      )}

      {tab === "cash" && (
        <Card pad={false}>
          <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
              <ArrowDownLeft className="size-5 text-emerald-600" />
              <div><div className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400">Cash In</div><div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{fmtMoney(cashIn, sym)}</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 dark:bg-rose-950/40">
              <ArrowUpRight className="size-5 text-rose-600" />
              <div><div className="text-[10px] uppercase text-rose-600 dark:text-rose-400">Cash Out</div><div className="text-lg font-bold text-rose-700 dark:text-rose-300">{fmtMoney(cashOut, sym)}</div></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-950/40">
              <Wallet className="size-5 text-indigo-600" />
              <div><div className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400">Balance</div><div className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{fmtMoney(cashBal, sym)}</div></div>
            </div>
          </div>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
              { key: "desc", label: "Description", render: (e) => e.desc },
              { key: "in", label: "In", align: "right", render: (e) => <span className="text-emerald-600">{e.in ? fmtMoney(e.in, sym) : ""}</span> },
              { key: "out", label: "Out", align: "right", render: (e) => <span className="text-rose-600">{e.out ? fmtMoney(e.out, sym) : ""}</span> },
              { key: "bal", label: "Balance", align: "right", render: (e) => <b>{fmtMoney(e.balance, sym)}</b> },
            ]}
            rows={db.cash}
            rowKey={(e) => e.id}
            pageSize={15}
            empty="No cash entries."
          />
        </Card>
      )}

      {tab === "exp" && (
        <Card title="Shop Expenses" pad={false}
          actions={<div className="flex gap-2 p-3">
            <Btn variant="outline" size="sm" icon={<Download className="size-4" />} onClick={() => csvJournal("exp")}>CSV</Btn>
            <Btn variant="outline" size="sm" icon={<Printer className="size-4" />} onClick={() => printJournal("exp")}>Print</Btn>
            <Btn size="sm" icon={<Plus className="size-4" />} onClick={() => setExpOpen(true)}>Add Expense</Btn>
          </div>}>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
              { key: "cat", label: "Category", render: (e) => <Tag tone="orange">{e.category}</Tag> },
              { key: "desc", label: "Description", render: (e) => e.description || "—" },
              { key: "amount", label: "Amount", align: "right", sort: (e) => e.amount, render: (e) => <b className="text-rose-600">{fmtMoney(e.amount, sym)}</b> },
              { key: "method", label: "Method", render: (e) => e.method },
              { key: "act", label: "", align: "right", render: (e) => <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={async () => { if (await confirm("Delete this expense?", "", true)) deleteExpense(e.id); }} /> },
            ]}
            rows={expenses}
            rowKey={(e) => e.id}
            pageSize={12}
            empty="No expenses recorded."
          />
        </Card>
      )}

      {tab === "inc" && (
        <Card title="Income" pad={false}
          actions={<div className="flex gap-2 p-3">
            <Btn variant="outline" size="sm" icon={<Download className="size-4" />} onClick={() => csvJournal("inc")}>CSV</Btn>
            <Btn variant="outline" size="sm" icon={<Printer className="size-4" />} onClick={() => printJournal("inc")}>Print</Btn>
            <Btn size="sm" icon={<Plus className="size-4" />} onClick={() => setIncOpen(true)}>Add Income</Btn>
          </div>}>
          <TableX
            cols={[
              { key: "dt", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
              { key: "type", label: "Type", render: (e) => <Tag tone="green">{e.type}</Tag> },
              { key: "desc", label: "Description", render: (e) => e.description || "—" },
              { key: "amount", label: "Amount", align: "right", sort: (e) => e.amount, render: (e) => <b className="text-emerald-600">{fmtMoney(e.amount, sym)}</b> },
              { key: "method", label: "Method", render: (e) => e.method },
              { key: "act", label: "", align: "right", render: (e) => <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={async () => { if (await confirm("Delete this income entry?", "", true)) deleteIncome(e.id); }} /> },
            ]}
            rows={incomes}
            rowKey={(e) => e.id}
            pageSize={12}
            empty="No income recorded."
          />
        </Card>
      )}

      <JournalModal kind="exp" open={expOpen} onClose={() => setExpOpen(false)} onSave={(d) => { addExpense(d); setExpOpen(false); }} />
      <JournalModal kind="inc" open={incOpen} onClose={() => setIncOpen(false)} onSave={(d) => { addIncome(d); setIncOpen(false); }} />
    </Page>
  );
}

function JournalModal({ kind, open, onClose, onSave }: {
  kind: "exp" | "inc"; open: boolean; onClose: () => void;
  onSave: (d: { date: string; category: string; type: string; description: string; amount: number; method: string; note: string }) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [cat, setCat] = useState(kind === "exp" ? EXPENSE_CATS[0] : INCOME_TYPES[0]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  return (
    <Modal open={open} onClose={onClose} title={kind === "exp" ? "Add Expense" : "Add Income"} size="md"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Save className="size-4" />} onClick={() => {
            if (amount <= 0) { toast.error("Enter a valid amount."); return; }
            onSave({ date, category: kind === "exp" ? cat : "", type: kind === "inc" ? cat : "", description: desc, amount, method, note });
          }}>Save</Btn>
        </>
      }>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" required><Inp type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={kind === "exp" ? "Category" : "Type"} required>
          <Sel value={cat} onChange={(e) => setCat(e.target.value)}>
            {(kind === "exp" ? EXPENSE_CATS : INCOME_TYPES).map((c) => <option key={c} value={c}>{c}</option>)}
          </Sel>
        </Field>
        <Field label="Description" className="sm:col-span-2"><Inp value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. WAPDA bill, commission…" /></Field>
        <Field label="Amount" required><Num value={amount} min={0} onChange={(e) => setAmount(num(e.target.value))} autoFocus /></Field>
        <Field label="Payment Method">
          <Sel value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Sel>
        </Field>
        <Field label="Notes" className="sm:col-span-2"><Inp value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
