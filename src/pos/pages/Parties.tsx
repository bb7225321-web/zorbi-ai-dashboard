import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, BookOpenText, HandCoins, History, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { usePos } from "../store";
import { Page, Card, Btn, IconBtn, Modal, Field, Inp, Num, Sel, Txta, Tag, Money, Empty, TableX } from "../ui";
import { Customer, Supplier, fmtMoney, fmtDate, todayISO, uid, round2 } from "../core";

export function Customers() {
  return <Parties kind="c" />;
}
export function Suppliers() {
  return <Parties kind="s" />;
}

function Parties({ kind }: { kind: "c" | "s" }) {
  const { db, saveCustomer, deleteCustomer, saveSupplier, deleteSupplier, receivePayment, paySupplier, print, confirm } = usePos();
  const sym = db.settings.currency.symbol;
  const isC = kind === "c";
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | Supplier | null>(null);
  const [ledgerFor, setLedgerFor] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [histFor, setHistFor] = useState<string | null>(null);

  const list = (isC ? db.customers : db.suppliers).filter((x) => {
    const t = q.toLowerCase();
    return !t || x.name.toLowerCase().includes(t) || x.phone.toLowerCase().includes(t) ||
      (isC && (x as Customer).cnic.toLowerCase().includes(t));
  });

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (x: Customer | Supplier) => { setEditing(x); setFormOpen(true); };

  const handleDelete = async (x: Customer | Supplier) => {
    const ok = await confirm(`Delete ${isC ? "customer" : "supplier"} "${x.name}"?`, "Only parties with a zero balance can be deleted.", true);
    if (!ok) return;
    const e = isC ? deleteCustomer(x.id) : deleteSupplier(x.id);
    if (e) toast.error(e);
  };

  const cols = [
    { key: "name", label: isC ? "Customer" : "Supplier", sort: (x: Customer | Supplier) => x.name, render: (x: Customer | Supplier) => (
      <div>
        <div className="font-medium text-slate-800 dark:text-slate-100">{x.name}</div>
        <div className="text-xs text-slate-400">{x.phone || "—"}{x.email ? ` · ${x.email}` : ""}</div>
      </div>
    ) },
    { key: "addr", label: "Address", render: (x: Customer | Supplier) => <span className="text-xs text-slate-400">{x.address || "—"}</span> },
    ...(isC ? [{
      key: "limit", label: "Credit Limit", align: "right" as const, render: (x: Customer | Supplier) => <span className="text-xs">{fmtMoney((x as Customer).creditLimit, sym)}</span>,
    }] : []),
    { key: "bal", label: isC ? "Receivable" : "Payable", align: "right" as const, sort: (x: Customer | Supplier) => x.balance, render: (x: Customer | Supplier) => (
      <b className={x.balance > 0.001 ? "text-rose-600" : x.balance < -0.001 ? "text-emerald-600" : "text-slate-400"}>{fmtMoney(x.balance, sym)}</b>
    ) },
    { key: "act", label: "", align: "right" as const, render: (x: Customer | Supplier) => (
      <div className="flex justify-end gap-1">
        <IconBtn icon={<BookOpenText className="size-4" />} label="Ledger" tone="primary" onClick={() => setLedgerFor(x.id)} />
        <IconBtn icon={isC ? <HandCoins className="size-4" /> : <HandCoins className="size-4" />} label={isC ? "Receive payment" : "Pay supplier"} onClick={() => setPayFor(x.id)} />
        <IconBtn icon={<History className="size-4" />} label="History" onClick={() => setHistFor(x.id)} />
        <IconBtn icon={<Pencil className="size-4" />} label="Edit" onClick={() => openEdit(x)} />
        <IconBtn icon={<Trash2 className="size-4" />} label="Delete" tone="danger" onClick={() => handleDelete(x)} />
      </div>
    ) },
  ];

  return (
    <Page
      title={isC ? "Customers" : "Suppliers"}
      subtitle={isC
        ? `${db.customers.length} customers · total receivables ${fmtMoney(db.customers.reduce((s, c) => s + Math.max(0, c.balance), 0), sym)}`
        : `${db.suppliers.length} suppliers · total payables ${fmtMoney(db.suppliers.reduce((s, x) => s + Math.max(0, x.balance), 0), sym)}`}
      actions={<Btn icon={<Plus className="size-4" />} onClick={openNew}>New {isC ? "Customer" : "Supplier"}</Btn>}
      wide
    >
      <Card pad={false}
        actions={<div className="p-3"><div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Inp className="w-72 pl-9" placeholder={`Search ${isC ? "customers" : "suppliers"} by name or phone…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div></div>}>
        <TableX cols={cols} rows={list} rowKey={(x) => x.id} pageSize={12} empty={isC ? "No customers found." : "No suppliers found."} />
      </Card>

      {formOpen && (
        <PartyForm kind={kind} party={editing} onClose={() => setFormOpen(false)}
          onSave={(x, isNew) => {
            if (isC) saveCustomer(x as Customer, isNew);
            else saveSupplier(x as Supplier, isNew);
            setFormOpen(false);
          }} />
      )}
      {ledgerFor && <LedgerModal kind={kind} partyId={ledgerFor} onClose={() => setLedgerFor(null)} />}
      {payFor && <PaymentModal kind={kind} partyId={payFor} onClose={() => setPayFor(null)}
        onPay={(amount, method, note) => {
          if (isC) receivePayment(payFor, amount, method, note);
          else paySupplier(payFor, amount, method, note);
          setPayFor(null);
        }} />}
      {histFor && <HistoryModal kind={kind} partyId={histFor} onClose={() => setHistFor(null)} />}
    </Page>
  );
}

function PartyForm({ kind, party, onClose, onSave }: {
  kind: "c" | "s"; party: Customer | Supplier | null; onClose: () => void; onSave: (x: Customer | Supplier, isNew: boolean) => void;
}) {
  const isC = kind === "c";
  const [f, setF] = useState<Customer | Supplier>(party ? { ...party } : isC
    ? { id: "", name: "", phone: "", cnic: "", address: "", email: "", creditLimit: 0, openingBalance: 0, balance: 0, notes: "", createdAt: todayISO() }
    : { id: "", name: "", contactPerson: "", phone: "", address: "", email: "", openingBalance: 0, balance: 0, notes: "", createdAt: todayISO() });
  const set = (patch: Partial<Customer | Supplier>) => setF({ ...f, ...patch });
  const isNew = !party;
  return (
    <Modal open onClose={onClose} title={isNew ? `New ${isC ? "Customer" : "Supplier"}` : `Edit — ${party?.name}`} size="md"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn icon={<Save className="size-4" />} onClick={() => {
            if (!f.name.trim()) { toast.error(`${isC ? "Customer" : "Supplier"} name is required.`); return; }
            onSave(f, isNew);
          }}>{isNew ? "Save" : "Update"}</Btn>
        </>
      }>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={isC ? "Customer Name" : "Supplier Name"} required><Inp value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Phone"><Inp value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
        {isC && <Field label="CNIC (optional)"><Inp value={(f as Customer).cnic} onChange={(e) => set({ cnic: e.target.value })} placeholder="35201-1234567-1" /></Field>}
        {!isC && <Field label="Contact Person"><Inp value={(f as Supplier).contactPerson} onChange={(e) => set({ contactPerson: e.target.value })} /></Field>}
        <Field label="Email"><Inp value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        <Field label="Address" className="sm:col-span-2"><Inp value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        {isC ? (
          <>
            <Field label="Credit Limit"><Num value={(f as Customer).creditLimit} min={0} onChange={(e) => set({ creditLimit: num(e.target.value) })} /></Field>
            <Field label="Opening Balance"><Num value={(f as Customer).openingBalance} onChange={(e) => set({ openingBalance: num(e.target.value) })} /></Field>
          </>
        ) : (
          <Field label="Opening Balance"><Num value={(f as Supplier).openingBalance} onChange={(e) => set({ openingBalance: num(e.target.value) })} /></Field>
        )}
        <Field label="Notes" className="sm:col-span-2"><Txta value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function LedgerModal({ kind, partyId, onClose }: { kind: "c" | "s"; partyId: string; onClose: () => void }) {
  const { db, print } = usePos();
  const sym = db.settings.currency.symbol;
  const party = kind === "c" ? db.customers.find((x) => x.id === partyId) : db.suppliers.find((x) => x.id === partyId);
  if (!party) return null;
  const ledger = (kind === "c" ? db.cLedger : db.sLedger)
    .filter((e) => e.partyId === partyId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal open onClose={onClose} title={`Ledger — ${party.name}`} subtitle={`Opening balance ${fmtMoney(party.openingBalance, sym)} · Current ${kind === "c" ? "receivable" : "payable"} ${fmtMoney(party.balance, sym)}`} size="xl"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => print({ kind: "statement", data: { kind, partyId } })}>Print Statement</Btn>
        </>
      }>
      <TableX
        cols={[
          { key: "date", label: "Date", sort: (e) => e.date, render: (e) => <span className="text-xs">{fmtDate(e.date)}</span> },
          { key: "ref", label: "Ref", render: (e) => <span className="font-mono text-xs">{e.ref}</span> },
          { key: "type", label: "Type", render: (e) => <Tag tone={e.type === "invoice" ? (kind === "c" ? "blue" : "violet") : e.type === "payment" ? "green" : e.type === "return" ? "amber" : "slate"}>{e.type}</Tag> },
          { key: "note", label: "Note", render: (e) => <span className="text-xs text-slate-400">{e.note}</span> },
          { key: "debit", label: "Debit", align: "right", render: (e) => <span className={e.debit ? "text-rose-600" : ""}>{e.debit ? fmtMoney(e.debit, sym) : ""}</span> },
          { key: "credit", label: "Credit", align: "right", render: (e) => <span className={e.credit ? "text-emerald-600" : ""}>{e.credit ? fmtMoney(e.credit, sym) : ""}</span> },
          { key: "bal", label: "Balance", align: "right", render: (e) => <b className="tabular-nums">{fmtMoney(e.balance, sym)}</b> },
        ]}
        rows={ledger}
        rowKey={(e) => e.id}
        pageSize={15}
        empty="No ledger entries yet."
      />
    </Modal>
  );
}

function PaymentModal({ kind, partyId, onClose, onPay }: {
  kind: "c" | "s"; partyId: string; onClose: () => void; onPay: (amount: number, method: string, note: string) => void;
}) {
  const { db } = usePos();
  const sym = db.settings.currency.symbol;
  const party = kind === "c" ? db.customers.find((x) => x.id === partyId) : db.suppliers.find((x) => x.id === partyId);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  if (!party) return null;
  return (
    <Modal open onClose={onClose} title={kind === "c" ? `Receive Payment — ${party.name}` : `Pay Supplier — ${party.name}`}
      subtitle={`Current ${kind === "c" ? "receivable" : "payable"}: ${fmtMoney(party.balance, sym)}`} size="sm"
      footer={
        <>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn variant="success" icon={<HandCoins className="size-4" />} onClick={() => {
            if (amount <= 0) { toast.error("Enter a valid amount."); return; }
            onPay(amount, method, note);
          }}>Record Payment</Btn>
        </>
      }>
      <div className="space-y-4">
        <Field label="Amount" required><Num value={amount} min={0} autoFocus onChange={(e) => setAmount(num(e.target.value))} /></Field>
        <Field label="Method">
          <Sel value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Cash</option><option>Bank Transfer</option><option>Credit Card</option><option>Cheque</option><option>Other</option>
          </Sel>
        </Field>
        <Field label="Note"><Inp value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional reference" /></Field>
        {amount > 0 && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950/40">
            New balance: <b className="text-emerald-700 dark:text-emerald-300">{fmtMoney(round2(party.balance - (kind === "c" ? amount : -amount)), sym)}</b>
          </div>
        )}
      </div>
    </Modal>
  );
}

function HistoryModal({ kind, partyId, onClose }: { kind: "c" | "s"; partyId: string; onClose: () => void }) {
  const { db, print } = usePos();
  const sym = db.settings.currency.symbol;
  const party = kind === "c" ? db.customers.find((x) => x.id === partyId) : db.suppliers.find((x) => x.id === partyId);
  if (!party) return null;
  const sales = kind === "c" ? db.sales.filter((s) => s.status === "final" && s.customerId === partyId).sort((a, b) => b.date.localeCompare(a.date)) : [];
  const purchases = kind === "s" ? db.purchases.filter((p) => p.status === "final" && p.supplierId === partyId).sort((a, b) => b.date.localeCompare(a.date)) : [];
  return (
    <Modal open onClose={onClose} title={`History — ${party.name}`} size="xl"
      footer={<Btn variant="outline" onClick={onClose}>Close</Btn>}>
      {kind === "c" ? (
        <TableX
          cols={[
            { key: "no", label: "Receipt", render: (s) => <span className="font-semibold">{s.no}</span> },
            { key: "dt", label: "Date", render: (s) => <span className="text-xs">{fmtDate(s.date)}</span> },
            { key: "items", label: "Items", align: "center", render: (s) => s.items.length },
            { key: "net", label: "Net", align: "right", render: (s) => <Money v={s.net} symbol={sym} /> },
            { key: "paid", label: "Paid", align: "right", render: (s) => <Money v={s.paid} symbol={sym} /> },
            { key: "bal", label: "Balance", align: "right", render: (s) => <b>{fmtMoney(s.balance, sym)}</b> },
            { key: "act", label: "", align: "right", render: (s) => <Btn size="sm" variant="outline" icon={<Printer className="size-4" />} onClick={() => print({ kind: "sale", data: s.id })}>Print</Btn> },
          ]}
          rows={sales}
          rowKey={(s) => s.id}
          pageSize={10}
          empty="No sales for this customer."
        />
      ) : (
        <TableX
          cols={[
            { key: "no", label: "Invoice", render: (p) => <span className="font-semibold">{p.no}</span> },
            { key: "dt", label: "Date", render: (p) => <span className="text-xs">{fmtDate(p.date)}</span> },
            { key: "items", label: "Items", align: "center", render: (p) => p.items.reduce((s, i) => s + i.qty, 0) },
            { key: "total", label: "Total", align: "right", render: (p) => <Money v={p.total} symbol={sym} /> },
            { key: "mode", label: "Mode", render: (p) => p.mode },
            { key: "act", label: "", align: "right", render: (p) => <Btn size="sm" variant="outline" icon={<Printer className="size-4" />} onClick={() => print({ kind: "purchase", data: p.id })}>Print</Btn> },
          ]}
          rows={purchases}
          rowKey={(p) => p.id}
          pageSize={10}
          empty="No purchases from this supplier."
        />
      )}
    </Modal>
  );
}

function num(v: string): number { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
