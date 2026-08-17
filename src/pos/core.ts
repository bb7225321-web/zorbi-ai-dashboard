// ============================================================================
// MY PHARMACY POS — core domain types, helpers, totals math, stock allocation
// ============================================================================

export type Role = "admin" | "manager" | "cashier";
export type PaperSize = "58mm" | "80mm" | "A4" | "A5";
export type Screen =
  | "dashboard" | "pos" | "purchases" | "products" | "inventory"
  | "customers" | "suppliers" | "accounts" | "reports" | "users" | "settings";

export interface User {
  id: string; username: string; name: string; password: string;
  role: Role; active: boolean; mustChange: boolean; createdAt: string;
}

export interface Product {
  id: string; code: string; barcode: string; altBarcode: string;
  name: string; generic: string; brand: string; category: string;
  subCategory: string; group: string; supplierId: string; type: string;
  control: boolean; seasonal: boolean;
  unit: string; purchaseUnit: string; conversion: number;
  avgCost: number; purchasePrice: number; retailPrice: number; wholesalePrice: number;
  minStock: number; optStock: number; maxStock: number;
  taxPct: number; discountPct: number; location: string; notes: string;
  createdAt: string;
}

export interface Batch {
  id: string; productId: string; batchNo: string; mfgDate: string; expDate: string;
  qty: number; cost: number; salePrice: number; supplierId: string; purchaseId: string;
  createdAt: string;
}

export interface Customer {
  id: string; name: string; phone: string; address: string; email: string;
  creditLimit: number; openingBalance: number; balance: number; notes: string; createdAt: string;
}

export interface Supplier {
  id: string; name: string; contactPerson: string; phone: string; address: string; email: string;
  openingBalance: number; balance: number; notes: string; createdAt: string;
}

export interface SaleItem {
  id: string; productId: string; productName: string; generic: string;
  batchId: string; batchNo: string; expDate: string; unit: string;
  rate: number; qty: number; discountPct: number; taxPct: number;
  discount: number; tax: number; total: number; cost: number;
}

export type PayMethod = "cash" | "credit" | "cash+credit" | "card" | "other";

export interface Sale {
  id: string; no: string; date: string; time: string;
  customerId: string; customerName: string; customerPhone: string;
  cashierId: string; cashierName: string; items: SaleItem[];
  gross: number; itemDisc: number; receiptDiscPct: number; receiptDisc: number;
  tax: number; additional: number; advance: number; net: number;
  method: PayMethod; paid: number; change: number; balance: number;
  status: "final" | "hold"; returned: boolean; notes: string; createdAt: string;
}

export interface PurchaseItem {
  id: string; productId: string; productName: string; generic: string;
  batchNo: string; mfgDate: string; expDate: string;
  qty: number; freeQty: number; cost: number; retail: number;
  discountPct: number; taxPct: number; discount: number; tax: number; total: number;
}

export interface Purchase {
  id: string; no: string; supplierId: string; supplierName: string;
  invoiceNo: string; billNo: string; billDate: string; dueDate: string;
  date: string; time: string; mode: string; comments: string; items: PurchaseItem[];
  subTotal: number; discount: number; loading: number; freight: number; other: number;
  additional: number; tax: number; advanceTax: number; withTax: number; total: number;
  status: "final" | "hold"; returned: boolean; userId: string; userName: string; createdAt: string;
}

export interface SaleReturnItem {
  id: string; productId: string; productName: string; batchId: string; batchNo: string;
  expDate: string; qty: number; rate: number; cost: number; discount: number; total: number;
}
export interface SaleReturn {
  id: string; no: string; saleId: string; saleNo: string; customerId: string; customerName: string;
  date: string; items: SaleReturnItem[]; total: number; method: string; note: string;
  userId: string; userName: string;
}
export interface PurchaseReturnItem {
  id: string; productId: string; productName: string; batchId: string; batchNo: string;
  expDate: string; qty: number; cost: number; total: number;
}
export interface PurchaseReturn {
  id: string; no: string; purchaseId: string; purchaseNo: string; supplierId: string; supplierName: string;
  date: string; items: PurchaseReturnItem[]; total: number; note: string; userId: string; userName: string;
}

export interface LedgerEntry {
  id: string; partyId: string; partyName: string; date: string;
  ref: string; type: "opening" | "invoice" | "payment" | "return" | "adjustment";
  debit: number; credit: number; balance: number; note: string;
}
export interface CashEntry { id: string; date: string; desc: string; in: number; out: number; balance: number; }
export interface Expense { id: string; date: string; category: string; description: string; amount: number; method: string; note: string; }
export interface Income { id: string; date: string; type: string; description: string; amount: number; method: string; note: string; }
export interface Adjustment {
  id: string; date: string; productId: string; productName: string; batchId: string; batchNo: string;
  delta: number; reason: string; userId: string; userName: string;
}
export interface AuditEntry { id: string; date: string; time: string; userId: string; userName: string; action: string; detail: string; }

export interface Settings {
  pharmacy: { name: string; address: string; phone: string; email: string; license: string; footer: string };
  currency: { code: string; symbol: string };
  tax: { salesTaxPct: number; purchaseTaxPct: number };
  receipt: { paper: PaperSize; copies: number; header: string; footer: string };
  inventory: { expiryWarningDays: number };
  security: { allowExpiredSales: boolean };
  appearance: "light" | "dark";
}

export interface DB {
  version: number; demo: boolean;
  users: User[]; products: Product[]; batches: Batch[];
  customers: Customer[]; suppliers: Supplier[];
  sales: Sale[]; purchases: Purchase[];
  saleReturns: SaleReturn[]; purchaseReturns: PurchaseReturn[];
  cLedger: LedgerEntry[]; sLedger: LedgerEntry[]; cash: CashEntry[];
  expenses: Expense[]; incomes: Income[];
  adjustments: Adjustment[]; audit: AuditEntry[];
  settings: Settings; counters: Record<string, number>;
}

// ---------------------------------------------------------------------------
// constants
// ---------------------------------------------------------------------------
export const PAPER_SIZES: PaperSize[] = ["80mm", "58mm", "A4", "A5"];
export const UNITS = ["Tab", "Cap", "Syp", "Inj", "Drops", "Cream", "Oint", "Spray", "Roll", "Sachet", "Pcs", "Btl"];
export const PRODUCT_TYPES = ["Medicine", "OTC", "Medical Supply", "Cosmetic", "Other"];
export const EXPENSE_CATS = ["Electricity", "Rent", "Salary", "Transport", "Maintenance", "Tax", "Other"];
export const INCOME_TYPES = ["Interest", "Commission", "Sale of Assets", "Other"];
export const PAY_METHODS = ["Cash", "Credit Card", "Bank Transfer", "Other"];
export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", manager: "Manager", cashier: "Cashier" };

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
let seq = 0;
export function uid(): string {
  seq = (seq + 1) % 100000;
  return `${Date.now().toString(36)}${seq.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const nowHM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Whole days from today until the given date (negative = past/expired). */
export function daysUntil(iso: string): number {
  const today = new Date(todayISO() + "T00:00:00").getTime();
  const d = new Date(iso + "T00:00:00").getTime();
  return Math.round((d - today) / 86400000);
}
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
};
export function fmtMoney(n: number, symbol = "₨"): string {
  const v = round2(n);
  const s = v.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `-${symbol} ${s.replace("-", "")}` : `${symbol} ${s}`;
}
export function fmtNum(n: number): string {
  return round2(n).toLocaleString("en-PK", { maximumFractionDigits: 2 });
}
export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtDT(date: string, time: string): string {
  return `${fmtDate(date)} ${time || ""}`.trim();
}
export function hashPw(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "h" + (h >>> 0).toString(36) + s.length.toString(36);
}
export function download(filename: string, content: string, mime = "text/plain"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
}

// ---------------------------------------------------------------------------
// totals math (single source of truth — used by POS, purchases, seed, reports)
// ---------------------------------------------------------------------------
export interface SaleLineLike { rate: number; qty: number; discountPct: number; taxPct: number; cost: number; }

export function calcSaleTotals(
  lines: SaleLineLike[],
  receiptDiscPct: number,
  additional: number,
  advance: number,
  salesTaxPct: number,
): { gross: number; itemDisc: number; receiptDisc: number; tax: number; net: number; lineTax: number[] } {
  let gross = 0, itemDisc = 0, tax = 0;
  const lineTax: number[] = [];
  for (const l of lines) {
    const line = round2(l.rate * l.qty);
    const disc = round2((line * l.discountPct) / 100);
    const t = round2(((line - disc) * l.taxPct) / 100);
    gross = round2(gross + line);
    itemDisc = round2(itemDisc + disc);
    tax = round2(tax + t);
    lineTax.push(t);
  }
  const receiptDisc = round2(((gross - itemDisc) * receiptDiscPct) / 100);
  const net = round2(gross - itemDisc - receiptDisc + tax + additional - advance);
  return { gross, itemDisc, receiptDisc, tax, net, lineTax };
}

export function lineTotal(rate: number, qty: number, discountPct: number, taxPct: number): { discount: number; tax: number; total: number } {
  const line = round2(rate * qty);
  const discount = round2((line * discountPct) / 100);
  const tax = round2(((line - discount) * taxPct) / 100);
  return { discount, tax, total: round2(line - discount + tax) };
}

export function calcPurchaseTotals(
  items: { qty: number; freeQty: number; cost: number; discountPct: number; taxPct: number }[],
  loading: number, freight: number, other: number, additional: number,
  purchaseTaxPct: number, discount: number, advanceTax: number, withTax: number,
): { subTotal: number; itemDisc: number; tax: number; total: number } {
  let subTotal = 0, itemDisc = 0, tax = 0;
  for (const it of items) {
    const line = round2(it.qty * it.cost);
    const d = round2((line * it.discountPct) / 100);
    const t = round2(((line - d) * it.taxPct) / 100);
    subTotal = round2(subTotal + line);
    itemDisc = round2(itemDisc + d);
    tax = round2(tax + t);
  }
  const total = round2(subTotal - itemDisc - discount + loading + freight + other + additional + tax - advanceTax - withTax);
  return { subTotal, itemDisc, tax, total };
}

// ---------------------------------------------------------------------------
// expiry & stock helpers
// ---------------------------------------------------------------------------
export type ExpiryTone = "red" | "amber" | "yellow" | "green";
export interface ExpiryInfo { label: string; tone: ExpiryTone; days: number; }

export function expiryInfo(batch: Batch, warningDays = 30): ExpiryInfo {
  const d = daysUntil(batch.expDate);
  if (d < 0) return { label: `Expired ${Math.abs(d)}d ago`, tone: "red", days: d };
  if (d <= 7) return { label: `Expires in ${d}d`, tone: "red", days: d };
  if (d <= 30) return { label: `Expires in ${d}d`, tone: "amber", days: d };
  if (d <= 60) return { label: `Expires in ${d}d`, tone: "yellow", days: d };
  if (d <= 90) return { label: `Expires in ${d}d`, tone: "yellow", days: d };
  return { label: `Expires in ${d}d`, tone: "green", days: d };
}

export function stockOf(db: DB, productId: string): number {
  return db.batches.filter((b) => b.productId === productId).reduce((s, b) => s + b.qty, 0);
}

export function stockValue(db: DB): number {
  return db.batches.reduce((s, b) => s + b.qty * b.cost, 0);
}

export function findProduct(db: DB, query: string): Product | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return db.products.find(
    (p) =>
      p.barcode === q || p.altBarcode === q || p.code.toLowerCase() === q ||
      p.name.toLowerCase() === q || p.generic.toLowerCase() === q,
  );
}

/** FEFO allocation across batches. Returns allocation list or an error string. */
export function allocateFEFO(
  db: DB, productId: string, qty: number, allowExpired: boolean,
): { batchId: string; qty: number }[] | string {
  if (qty <= 0) return "Please enter a valid quantity.";
  const usable = db.batches
    .filter((b) => b.productId === productId && b.qty > 0 && (allowExpired || daysUntil(b.expDate) >= 0))
    .sort((a, b) => a.expDate.localeCompare(b.expDate) || a.createdAt.localeCompare(b.createdAt));
  const alloc: { batchId: string; qty: number }[] = [];
  let need = qty;
  for (const b of usable) {
    if (need <= 0) break;
    const take = Math.min(need, b.qty);
    alloc.push({ batchId: b.id, qty: take });
    need = round2(need - take);
  }
  if (need > 0) return "Insufficient stock available.";
  return alloc;
}

export function availableBatches(db: DB, productId: string, allowExpired: boolean): Batch[] {
  return db.batches
    .filter((b) => b.productId === productId && b.qty > 0 && (allowExpired || daysUntil(b.expDate) >= 0))
    .sort((a, b) => a.expDate.localeCompare(b.expDate));
}

export function nextNo(db: DB, prefix: string): string {
  const n = (db.counters[prefix] || 0) + 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export function bumpNo(db: DB, prefix: string): string {
  const no = nextNo(db, prefix);
  db.counters[prefix] = (db.counters[prefix] || 0) + 1;
  return no;
}

export function syncCustomerBalance(db: DB, customerId: string): void {
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) return;
  const bal = db.cLedger
    .filter((e) => e.partyId === customerId)
    .reduce((s, e) => s + e.debit - e.credit, c.openingBalance);
  c.balance = round2(bal);
}
export function syncSupplierBalance(db: DB, supplierId: string): void {
  const s = db.suppliers.find((x) => x.id === supplierId);
  if (!s) return;
  const bal = db.sLedger
    .filter((e) => e.partyId === supplierId)
    .reduce((s2, e) => s2 + e.credit - e.debit, s.openingBalance);
  s.balance = round2(bal);
}
export function cLedgerBalance(db: DB, customerId: string): number {
  const c = db.customers.find((x) => x.id === customerId);
  if (!c) return 0;
  return round2(db.cLedger.filter((e) => e.partyId === customerId).reduce((s, e) => s + e.debit - e.credit, c.openingBalance));
}
export function sLedgerBalance(db: DB, supplierId: string): number {
  const s = db.suppliers.find((x) => x.id === supplierId);
  if (!s) return 0;
  return round2(db.sLedger.filter((e) => e.partyId === supplierId).reduce((x, e) => x + e.credit - e.debit, s.openingBalance));
}

export function addLedgerEntry(
  db: DB, kind: "c" | "s", partyId: string, partyName: string, date: string, ref: string,
  type: LedgerEntry["type"], debit: number, credit: number, note: string,
): void {
  const list = kind === "c" ? db.cLedger : db.sLedger;
  const prev = list.filter((e) => e.partyId === partyId).reduce((s, e) => s + e.debit - e.credit, 0);
  list.push({
    id: uid(), partyId, partyName, date, ref, type,
    debit: round2(debit), credit: round2(credit),
    balance: round2(prev + debit - credit), note,
  });
  if (kind === "c") syncCustomerBalance(db, partyId);
  else syncSupplierBalance(db, partyId);
}

export function addCashEntry(db: DB, date: string, desc: string, cashIn: number, cashOut: number): void {
  const prev = db.cash.length ? db.cash[db.cash.length - 1].balance : 0;
  db.cash.push({ id: uid(), date, desc, in: round2(cashIn), out: round2(cashOut), balance: round2(prev + cashIn - cashOut) });
}

export function audit(db: DB, user: User | null, action: string, detail: string): void {
  db.audit.push({
    id: uid(), date: todayISO(), time: nowHM(),
    userId: user?.id || "system", userName: user?.name || "System", action, detail,
  });
}

export function saleProfit(s: Sale): number {
  return s.items.reduce((t, i) => t + round2(i.rate * i.qty - i.discount - i.cost * i.qty), 0);
}

export const WALKIN_ID = "walkin";
