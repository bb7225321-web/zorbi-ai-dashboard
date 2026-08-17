// ============================================================================
// MY PHARMACY POS — state store: auth, CRUD, stock/ledger/cash business logic
// ============================================================================
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DB, User, Product, Customer, Supplier, Sale, Purchase, SaleReturn, PurchaseReturn,
  Settings, Screen, PayMethod, uid, todayISO, nowHM, bumpNo, round2, daysUntil,
  calcSaleTotals, lineTotal, addLedgerEntry, addCashEntry, audit, stockOf,
  fmtMoney, nextNo, syncCustomerBalance, syncSupplierBalance, download,
} from "./core";
import { buildSeed } from "./seed";

const DB_KEY = "my-pharmacy-pos-db-v1";
const SESSION_KEY = "my-pharmacy-pos-session-v1";

export type PrintKind =
  | "sale" | "purchase" | "saleReturn" | "purchaseReturn"
  | "statement" | "report" | "labels" | "product";
export interface PrintPayload {
  kind: PrintKind;
  data: unknown;
  paper?: string;
  copies?: number;
}

interface ConfirmState { title: string; message: string; danger?: boolean; resolve: (v: boolean) => void; }

interface PosApi {
  db: DB;
  user: User | null;
  screen: Screen;
  routeData: unknown;
  navTo: (screen: Screen, data?: unknown) => void;

  login: (username: string, password: string) => string | null;
  changePassword: (current: string, next: string) => string | null;
  logout: () => void;

  saveProduct: (p: Product, isNew: boolean) => void;
  deleteProduct: (id: string) => void;
  saveCustomer: (c: Customer, isNew: boolean) => void;
  deleteCustomer: (id: string) => string | null;
  saveSupplier: (s: Supplier, isNew: boolean) => void;
  deleteSupplier: (id: string) => string | null;
  saveUser: (u: User, isNew: boolean) => void;
  deleteUser: (id: string) => string | null;
  resetPassword: (id: string, newPw: string) => string | null;

  holdSale: (draft: Sale) => string | null;
  deleteHold: (id: string) => void;
  saveSale: (draft: Sale, printIt?: boolean) => string | null;
  returnSale: (saleId: string, lines: { productId: string; batchId: string; qty: number }[], method: string, note: string) => string | null;
  alreadyReturned: (sale: Sale, productId: string, batchId: string) => number;

  savePurchase: (draft: Purchase, printIt?: boolean) => string | null;
  holdPurchase: (draft: Purchase) => string | null;
  deletePurchaseDraft: (id: string) => void;
  returnPurchase: (purchaseId: string, lines: { productId: string; batchId: string; batchNo: string; qty: number }[], note: string) => string | null;

  adjustStock: (productId: string, batchId: string, delta: number, reason: string) => string | null;
  receivePayment: (customerId: string, amount: number, method: string, note: string) => void;
  paySupplier: (supplierId: string, amount: number, method: string, note: string) => void;
  addExpense: (e: { date: string; category: string; description: string; amount: number; method: string; note: string }) => void;
  deleteExpense: (id: string) => void;
  addIncome: (i: { date: string; type: string; description: string; amount: number; method: string; note: string }) => void;
  deleteIncome: (id: string) => void;

  updateSettings: (s: Settings) => void;
  backup: () => void;
  restore: (file: File) => Promise<string | null>;
  resetDemo: () => void;

  print: (p: PrintPayload) => void;
  printState: PrintPayload | null;
  closePrint: () => void;

  confirmState: ConfirmState | null;
  confirm: (title: string, message: string, danger?: boolean) => Promise<boolean>;
  resolveConfirm: (v: boolean) => void;

  // convenience lookups
  product: (id: string) => Product | undefined;
  customer: (id: string) => Customer | undefined;
  supplier: (id: string) => Supplier | undefined;
  batch: (id: string) => DB["batches"][number] | undefined;
  stock: (productId: string) => number;
}

const Ctx = createContext<PosApi | null>(null);

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.version && Array.isArray(parsed.products)) return parsed;
    }
  } catch {
    /* fall through to fresh seed */
  }
  const fresh = buildSeed();
  persist(fresh);
  return fresh;
}
function persist(db: DB) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch { /* storage full */ }
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function PosProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const id = localStorage.getItem(SESSION_KEY);
      if (!id) return null;
      const d = loadDB();
      const u = d.users.find((x) => x.id === id && x.active);
      return u || null;
    } catch { return null; }
  });
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [routeData, setRouteData] = useState<unknown>(null);
  const [printState, setPrintState] = useState<PrintPayload | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const confirmResolve = useRef<((v: boolean) => void) | null>(null);

  useEffect(() => { persist(db); }, [db]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", db.settings.appearance === "dark");
  }, [db.settings.appearance]);

  const commit = useCallback((next: DB, msg?: string) => {
    setDb(next);
    if (msg) toast.success(msg);
  }, []);

  const confirm = useCallback((title: string, message: string, danger?: boolean) => {
    return new Promise<boolean>((resolve) => {
      confirmResolve.current = (v: boolean) => {
        confirmResolve.current = null;
        setConfirmState(null);
        resolve(v);
      };
      setConfirmState({ title, message, danger, resolve: confirmResolve.current });
    });
  }, []);

  const navTo = useCallback((s: Screen, data?: unknown) => {
    setScreen(s);
    setRouteData(data ?? null);
    window.scrollTo(0, 0);
  }, []);

  const api = useMemo<PosApi>(() => {
    const ok = () => user;
    const err = (m: string) => m;

    const login = (username: string, password: string): string | null => {
      const u = db.users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
      if (!u) return "Invalid username or password.";
      if (!u.active) return "This account has been disabled. Contact the administrator.";
      if (u.password !== password) return "Invalid username or password.";
      setUser(u);
      localStorage.setItem(SESSION_KEY, u.id);
      const d = clone(db);
      audit(d, u, "Login", `User ${u.username} logged in`);
      setDb(d);
      return null;
    };

    const changePassword = (current: string, next: string): string | null => {
      if (!user) return "Not signed in.";
      if (user.password !== current) return "Current password is incorrect.";
      if (next.length < 6) return "New password must be at least 6 characters.";
      if (next === current) return "New password must be different from the current one.";
      const d = clone(db);
      const u = d.users.find((x) => x.id === user.id);
      if (!u) return "User not found.";
      u.password = next;
      u.mustChange = false;
      audit(d, u, "Password changed", `Password changed for ${u.username}`);
      setDb(d);
      setUser({ ...u });
      return null;
    };

    const logout = () => {
      const d = clone(db);
      audit(d, user, "Logout", `User ${user?.username || "?"} logged out`);
      setDb(d);
      setUser(null);
      localStorage.removeItem(SESSION_KEY);
      setScreen("dashboard");
      setRouteData(null);
    };

    // ------------------------------------------------------------- CRUD
    const saveProduct = (p: Product, isNew: boolean) => {
      const d = clone(db);
      if (isNew) {
        p.id = uid();
        p.createdAt = todayISO();
        d.products.push(p);
        audit(d, user, "Product created", `${p.name} (${p.code})`);
        commit(d, `Product "${p.name}" saved`);
      } else {
        const idx = d.products.findIndex((x) => x.id === p.id);
        if (idx >= 0) d.products[idx] = p;
        audit(d, user, "Product edited", `${p.name} (${p.code})`);
        commit(d, `Product "${p.name}" updated`);
      }
    };

    const deleteProduct = (id: string) => {
      const d = clone(db);
      const p = d.products.find((x) => x.id === id);
      if (!p) return;
      const stock = stockOf(d, id);
      if (stock > 0) { toast.error(`Cannot delete: product still has ${stock} units in stock. Adjust or sell first.`); return; }
      d.products = d.products.filter((x) => x.id !== id);
      audit(d, user, "Product deleted", p.name);
      commit(d, "Product deleted");
    };

    const saveCustomer = (c: Customer, isNew: boolean) => {
      const d = clone(db);
      if (isNew) {
        c.id = uid();
        c.createdAt = todayISO();
        d.customers.push(c);
        audit(d, user, "Customer created", c.name);
        commit(d, `Customer "${c.name}" saved`);
      } else {
        const idx = d.customers.findIndex((x) => x.id === c.id);
        if (idx >= 0) d.customers[idx] = c;
        syncCustomerBalance(d, c.id);
        audit(d, user, "Customer edited", c.name);
        commit(d, `Customer "${c.name}" updated`);
      }
    };

    const deleteCustomer = (id: string): string | null => {
      const c = db.customers.find((x) => x.id === id);
      if (!c) return null;
      if (Math.abs(c.balance) > 0.001) return "Cannot delete a customer with a non-zero balance.";
      const d = clone(db);
      d.customers = d.customers.filter((x) => x.id !== id);
      d.cLedger = d.cLedger.filter((e) => e.partyId !== id);
      audit(d, user, "Customer deleted", c.name);
      commit(d, "Customer deleted");
      return null;
    };

    const saveSupplier = (s: Supplier, isNew: boolean) => {
      const d = clone(db);
      if (isNew) {
        s.id = uid();
        s.createdAt = todayISO();
        d.suppliers.push(s);
        audit(d, user, "Supplier created", s.name);
        commit(d, `Supplier "${s.name}" saved`);
      } else {
        const idx = d.suppliers.findIndex((x) => x.id === s.id);
        if (idx >= 0) d.suppliers[idx] = s;
        syncSupplierBalance(d, s.id);
        audit(d, user, "Supplier edited", s.name);
        commit(d, `Supplier "${s.name}" updated`);
      }
    };

    const deleteSupplier = (id: string): string | null => {
      const s = db.suppliers.find((x) => x.id === id);
      if (!s) return null;
      if (Math.abs(s.balance) > 0.001) return "Cannot delete a supplier with a non-zero balance.";
      const d = clone(db);
      d.suppliers = d.suppliers.filter((x) => x.id !== id);
      d.sLedger = d.sLedger.filter((e) => e.partyId !== id);
      audit(d, user, "Supplier deleted", s.name);
      commit(d, "Supplier deleted");
      return null;
    };

    const saveUser = (u: User, isNew: boolean) => {
      const d = clone(db);
      if (isNew) {
        if (d.users.some((x) => x.username.toLowerCase() === u.username.toLowerCase()))
          return void toast.error("Username already exists.");
        u.id = uid();
        u.createdAt = todayISO();
        d.users.push(u);
        audit(d, user, "User created", `${u.username} (${u.role})`);
        commit(d, `User "${u.username}" created`);
      } else {
        const idx = d.users.findIndex((x) => x.id === u.id);
        if (idx >= 0) d.users[idx] = u;
        audit(d, user, "User edited", `${u.username} (${u.role})`);
        commit(d, `User "${u.username}" updated`);
      }
    };

    const deleteUser = (id: string): string | null => {
      if (id === user?.id) return "You cannot delete your own account.";
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      const admins = db.users.filter((x) => x.role === "admin" && x.active);
      if (u.role === "admin" && admins.length <= 1) return "At least one active administrator is required.";
      const d = clone(db);
      d.users = d.users.filter((x) => x.id !== id);
      audit(d, user, "User deleted", u.username);
      commit(d, `User "${u.username}" deleted`);
      return null;
    };

    const resetPassword = (id: string, newPw: string): string | null => {
      if (newPw.length < 6) return "New password must be at least 6 characters.";
      const d = clone(db);
      const u = d.users.find((x) => x.id === id);
      if (!u) return "User not found.";
      u.password = newPw;
      u.mustChange = false;
      audit(d, user, "Password reset", `Password reset for ${u.username}`);
      commit(d, `Password reset for "${u.username}"`);
      return null;
    };

    // ------------------------------------------------------------- SALES
    const holdSale = (draft: Sale): string | null => {
      if (!draft.items.length) return "Add at least one product.";
      const d = clone(db);
      const sale: Sale = { ...draft, id: uid(), no: nextNo(d, "SALE"), status: "hold", returned: false, createdAt: todayISO() };
      d.sales.push(sale);
      audit(d, user, "Sale held", `${sale.no} — ${sale.items.length} items`);
      commit(d, `Sale ${sale.no} held. Retrieve it anytime.`);
      return null;
    };

    const deleteHold = (id: string) => {
      const d = clone(db);
      d.sales = d.sales.filter((x) => !(x.id === id && x.status === "hold"));
      commit(d);
    };

    const saveSale = (draft: Sale, printIt?: boolean): string | null => {
      if (!draft.items.length) return "Add at least one product.";
      if (draft.method === "credit" && !draft.customerId) return "Select a customer for credit sales.";
      if (draft.method === "credit" && draft.customerId !== "walkin") {
        const c = db.customers.find((x) => x.id === draft.customerId);
        if (c && c.creditLimit > 0 && draft.balance > c.creditLimit - c.balance)
          return `Exceeds credit limit for ${c.name}.`;
      }
      const d = clone(db);
      for (const it of draft.items) {
        const bt = d.batches.find((b) => b.id === it.batchId);
        if (!bt) return `Batch not found for ${it.productName}.`;
        if (daysUntil(bt.expDate) < 0 && !d.settings.security.allowExpiredSales)
          return `WARNING: batch ${bt.batchNo} has expired and cannot be sold.`;
        if (bt.qty < it.qty) return `Insufficient stock available for ${it.productName} (batch ${bt.batchNo}).`;
      }
      for (const it of draft.items) {
        const bt = d.batches.find((b) => b.id === it.batchId)!;
        bt.qty = round2(bt.qty - it.qty);
      }
      const sale: Sale = {
        ...draft, id: uid(), no: bumpNo(d, "SALE"), status: "final", returned: false,
        cashierId: user?.id || "", cashierName: user?.name || "System", createdAt: todayISO(),
      };
      d.sales.push(sale);
      const hasCredit = sale.method === "credit" || sale.method === "cash+credit" || sale.balance > 0.001;
      if (sale.paid > 0)
        addCashEntry(d, sale.date, `Sale ${sale.no} — ${sale.method}`, sale.paid, 0);
      if (hasCredit) {
        addLedgerEntry(d, "c", sale.customerId, sale.customerName, sale.date, sale.no, "invoice", sale.net, 0, "Sale");
        if (sale.paid > 0)
          addLedgerEntry(d, "c", sale.customerId, sale.customerName, sale.date, sale.no, "payment", 0, sale.paid, "Payment at sale");
      }
      audit(d, user, "Sale created", `${sale.no} — ${sale.items.length} items, net ${fmtMoney(sale.net, d.settings.currency.symbol)}`);
      setDb(d);
      toast.success(`Sale ${sale.no} saved. Stock updated.`);
      if (printIt) setPrintState({ kind: "sale", data: sale.id, paper: d.settings.receipt.paper, copies: d.settings.receipt.copies });
      return null;
    };

    const alreadyReturned = (sale: Sale, productId: string, batchId: string): number =>
      db.saleReturns
        .filter((r) => r.saleId === sale.id)
        .flatMap((r) => r.items)
        .filter((i) => i.productId === productId && i.batchId === batchId)
        .reduce((s, i) => s + i.qty, 0);

    const returnSale = (saleId: string, lines: { productId: string; batchId: string; qty: number }[], method: string, note: string): string | null => {
      const sale = db.sales.find((x) => x.id === saleId && x.status === "final");
      if (!sale) return "Receipt not found.";
      if (!lines.length) return "Select at least one item to return.";
      const d = clone(db);
      const items: SaleReturn["items"] = [];
      for (const ln of lines) {
        const sit = d.sales.find((x) => x.id === saleId)?.items.find((i) => i.productId === ln.productId && i.batchId === ln.batchId);
        if (!sit) return `Item not found in receipt ${sale.no}.`;
        const returned = alreadyReturned(sale, ln.productId, ln.batchId);
        if (ln.qty <= 0) return "Enter a valid return quantity.";
        if (ln.qty > sit.qty - returned) return `Return quantity exceeds sold quantity for ${sit.productName}.`;
        const bt = d.batches.find((b) => b.id === ln.batchId);
        if (!bt) return "Batch not found.";
        bt.qty = round2(bt.qty + ln.qty);
        items.push({
          id: uid(), productId: sit.productId, productName: sit.productName, batchId: sit.batchId,
          batchNo: sit.batchNo, expDate: sit.expDate, qty: ln.qty, rate: sit.rate, cost: sit.cost,
          discount: round2((sit.rate * ln.qty * sit.discountPct) / 100), total: round2(sit.rate * ln.qty),
        });
      }
      const total = round2(items.reduce((s, i) => s + i.total, 0));
      const ret: SaleReturn = {
        id: uid(), no: bumpNo(d, "SRET"), saleId: sale.id, saleNo: sale.no,
        customerId: sale.customerId, customerName: sale.customerName, date: todayISO(),
        items, total, method, note, userId: user?.id || "", userName: user?.name || "System",
      };
      d.saleReturns.push(ret);
      const s2 = d.sales.find((x) => x.id === saleId)!;
      s2.returned = true;
      const refund = method === "Cash" ? total : 0;
      if (refund > 0) addCashEntry(d, ret.date, `Sales return ${ret.no} — cash refund`, 0, refund);
      if (sale.customerId !== "walkin" || method !== "Cash")
        addLedgerEntry(d, "c", sale.customerId, sale.customerName, ret.date, ret.no, "return", 0, total, "Sales return");
      audit(d, user, "Sales return created", `${ret.no} for ${sale.no} — ${fmtMoney(total, d.settings.currency.symbol)}`);
      setDb(d);
      toast.success(`Return ${ret.no} recorded. Stock restored.`);
      setPrintState({ kind: "saleReturn", data: ret.id, paper: d.settings.receipt.paper, copies: 1 });
      return null;
    };

    // ------------------------------------------------------------- PURCHASES
    const savePurchase = (draft: Purchase, printIt?: boolean): string | null => {
      if (!draft.supplierId) return "Select a supplier.";
      if (!draft.items.length) return "Add at least one product.";
      for (const it of draft.items) {
        if (it.qty <= 0) return `Enter a valid quantity for ${it.productName}.`;
        if (!it.batchNo.trim()) return `Batch number is required for ${it.productName}.`;
        if (!it.expDate) return `Expiry date is required for ${it.productName}.`;
      }
      const d = clone(db);
      const pur: Purchase = {
        ...draft, id: uid(), no: bumpNo(d, "PUR"), status: "final", returned: false,
        userId: user?.id || "", userName: user?.name || "System", createdAt: todayISO(),
      };
      d.purchases.push(pur);
      for (const it of draft.items) {
        const prod = d.products.find((x) => x.id === it.productId);
        const existing = d.batches.find(
          (b) => b.productId === it.productId && b.batchNo === it.batchNo.trim() && b.expDate === it.expDate,
        );
        const totalQty = round2(it.qty + it.freeQty);
        if (existing) {
          existing.qty = round2(existing.qty + totalQty);
          existing.cost = it.cost;
          existing.salePrice = it.retail;
          existing.supplierId = draft.supplierId;
        } else {
          d.batches.push({
            id: uid(), productId: it.productId, batchNo: it.batchNo.trim(),
            mfgDate: it.mfgDate, expDate: it.expDate, qty: totalQty, cost: it.cost,
            salePrice: it.retail, supplierId: draft.supplierId, purchaseId: pur.id, createdAt: todayISO(),
          });
        }
        if (prod) {
          const oldQty = stockOf(d, it.productId) - totalQty;
          const newCost = oldQty > 0 ? round2((oldQty * prod.avgCost + it.qty * it.cost) / (oldQty + it.qty)) : it.cost;
          prod.avgCost = round2(newCost);
          if (it.cost > 0) prod.purchasePrice = it.cost;
          if (it.retail > 0) prod.retailPrice = it.retail;
        }
      }
      const paid = draft.mode === "Cash" ? draft.total : 0;
      if (paid > 0) addCashEntry(d, pur.date, `Purchase ${pur.no} — paid`, 0, paid);
      addLedgerEntry(d, "s", draft.supplierId, draft.supplierName, pur.date, pur.no, "invoice", 0, draft.total, "Purchase");
      if (paid > 0) addLedgerEntry(d, "s", draft.supplierId, draft.supplierName, pur.date, pur.no, "payment", paid, 0, "Payment at purchase");
      audit(d, user, "Purchase created", `${pur.no} — ${pur.items.length} items, ${fmtMoney(pur.total, d.settings.currency.symbol)}`);
      setDb(d);
      toast.success(`Purchase ${pur.no} saved. Stock increased.`);
      if (printIt) setPrintState({ kind: "purchase", data: pur.id, paper: d.settings.receipt.paper, copies: 1 });
      return null;
    };

    const holdPurchase = (draft: Purchase): string | null => {
      if (!draft.supplierId) return "Select a supplier.";
      if (!draft.items.length) return "Add at least one product.";
      const d = clone(db);
      const pur: Purchase = {
        ...draft, id: uid(), no: nextNo(d, "PUR"), status: "hold", returned: false,
        userId: user?.id || "", userName: user?.name || "System", createdAt: todayISO(),
      };
      d.purchases.push(pur);
      audit(d, user, "Purchase held", `${pur.no} — ${pur.items.length} items (no stock change)`);
      commit(d, `Purchase ${pur.no} held. Stock not changed.`);
      return null;
    };

    const deletePurchaseDraft = (id: string) => {
      const d = clone(db);
      d.purchases = d.purchases.filter((x) => !(x.id === id && x.status === "hold"));
      commit(d);
    };

    const returnPurchase = (purchaseId: string, lines: { productId: string; batchId: string; batchNo: string; qty: number }[], note: string): string | null => {
      const pur = db.purchases.find((x) => x.id === purchaseId && x.status === "final");
      if (!pur) return "Purchase invoice not found.";
      if (!lines.length) return "Select at least one item to return.";
      const d = clone(db);
      const items: PurchaseReturn["items"] = [];
      for (const ln of lines) {
        const pit = d.purchases.find((x) => x.id === purchaseId)?.items.find((i) => i.productId === ln.productId && i.batchNo === ln.batchNo);
        if (!pit) return `Item not found in purchase ${pur.no}.`;
        const returnedQty = d.purchaseReturns
          .filter((r) => r.purchaseId === purchaseId)
          .flatMap((r) => r.items)
          .filter((i) => i.productId === ln.productId && i.batchNo === ln.batchNo)
          .reduce((s, i) => s + i.qty, 0);
        if (ln.qty <= 0 || ln.qty > pit.qty - returnedQty) return `Invalid return quantity for ${pit.productName}.`;
        const bt = d.batches.find((b) => b.id === ln.batchId);
        if (!bt || bt.qty < ln.qty) return `Insufficient batch stock to return ${pit.productName}.`;
        bt.qty = round2(bt.qty - ln.qty);
        items.push({
          id: uid(), productId: pit.productId, productName: pit.productName, batchId: bt.id,
          batchNo: pit.batchNo, expDate: pit.expDate, qty: ln.qty, cost: pit.cost, total: round2(ln.qty * pit.cost),
        });
      }
      const total = round2(items.reduce((s, i) => s + i.total, 0));
      const ret: PurchaseReturn = {
        id: uid(), no: bumpNo(d, "PRET"), purchaseId: pur.id, purchaseNo: pur.no,
        supplierId: pur.supplierId, supplierName: pur.supplierName, date: todayISO(),
        items, total, note, userId: user?.id || "", userName: user?.name || "System",
      };
      d.purchaseReturns.push(ret);
      d.purchases.find((x) => x.id === purchaseId)!.returned = true;
      addLedgerEntry(d, "s", pur.supplierId, pur.supplierName, ret.date, ret.no, "return", 0, total, "Purchase return");
      audit(d, user, "Purchase return created", `${ret.no} for ${pur.no} — ${fmtMoney(total, d.settings.currency.symbol)}`);
      setDb(d);
      toast.success(`Purchase return ${ret.no} recorded. Stock reduced.`);
      setPrintState({ kind: "purchaseReturn", data: ret.id, paper: d.settings.receipt.paper, copies: 1 });
      return null;
    };

    // ------------------------------------------------------------- STOCK / MONEY
    const adjustStock = (productId: string, batchId: string, delta: number, reason: string): string | null => {
      if (delta === 0) return "Enter a non-zero adjustment.";
      const d = clone(db);
      const bt = d.batches.find((b) => b.id === batchId);
      if (!bt) return "Batch not found.";
      const prod = d.products.find((x) => x.id === productId);
      if (bt.qty + delta < 0) return `Adjustment would make stock negative (current: ${bt.qty}).`;
      bt.qty = round2(bt.qty + delta);
      d.adjustments.push({
        id: uid(), date: todayISO(), productId, productName: prod?.name || "", batchId,
        batchNo: bt.batchNo, delta, reason, userId: user?.id || "", userName: user?.name || "System",
      });
      audit(d, user, "Stock adjusted", `${prod?.name || productId} batch ${bt.batchNo} ${delta > 0 ? "+" : ""}${delta} (${reason})`);
      commit(d, "Stock adjusted. Audit record created.");
      return null;
    };

    const receivePayment = (customerId: string, amount: number, method: string, note: string) => {
      if (amount <= 0) return void toast.error("Enter a valid amount.");
      const d = clone(db);
      const c = d.customers.find((x) => x.id === customerId);
      if (!c) return;
      const no = bumpNo(d, "PAY");
      addLedgerEntry(d, "c", customerId, c.name, todayISO(), no, "payment", 0, amount, `Received via ${method}${note ? " — " + note : ""}`);
      addCashEntry(d, todayISO(), `Payment received from ${c.name} (${no})`, amount, 0);
      audit(d, user, "Payment received", `${no} from ${c.name} — ${fmtMoney(amount, d.settings.currency.symbol)}`);
      commit(d, `Payment of ${fmtMoney(amount, d.settings.currency.symbol)} received from ${c.name}.`);
    };

    const paySupplier = (supplierId: string, amount: number, method: string, note: string) => {
      if (amount <= 0) return void toast.error("Enter a valid amount.");
      const d = clone(db);
      const s = d.suppliers.find((x) => x.id === supplierId);
      if (!s) return;
      const no = bumpNo(d, "PAY");
      addLedgerEntry(d, "s", supplierId, s.name, todayISO(), no, "payment", amount, 0, `Paid via ${method}${note ? " — " + note : ""}`);
      addCashEntry(d, todayISO(), `Payment to ${s.name} (${no})`, 0, amount);
      audit(d, user, "Payment made", `${no} to ${s.name} — ${fmtMoney(amount, d.settings.currency.symbol)}`);
      commit(d, `Payment of ${fmtMoney(amount, d.settings.currency.symbol)} made to ${s.name}.`);
    };

    const addExpense = (e: { date: string; category: string; description: string; amount: number; method: string; note: string }) => {
      if (e.amount <= 0) return void toast.error("Enter a valid amount.");
      const d = clone(db);
      d.expenses.push({ id: uid(), ...e });
      addCashEntry(d, e.date, `Expense — ${e.category}${e.description ? ": " + e.description : ""}`, 0, e.amount);
      audit(d, user, "Expense added", `${e.category} — ${fmtMoney(e.amount, d.settings.currency.symbol)}`);
      commit(d, "Expense recorded.");
    };

    const deleteExpense = (id: string) => {
      const d = clone(db);
      const e = d.expenses.find((x) => x.id === id);
      if (!e) return;
      d.expenses = d.expenses.filter((x) => x.id !== id);
      audit(d, user, "Expense deleted", `${e.category} — ${fmtMoney(e.amount, d.settings.currency.symbol)}`);
      commit(d, "Expense deleted.");
    };

    const addIncome = (i: { date: string; type: string; description: string; amount: number; method: string; note: string }) => {
      if (i.amount <= 0) return void toast.error("Enter a valid amount.");
      const d = clone(db);
      d.incomes.push({ id: uid(), ...i });
      addCashEntry(d, i.date, `Income — ${i.type}${i.description ? ": " + i.description : ""}`, i.amount, 0);
      audit(d, user, "Income added", `${i.type} — ${fmtMoney(i.amount, d.settings.currency.symbol)}`);
      commit(d, "Income recorded.");
    };

    const deleteIncome = (id: string) => {
      const d = clone(db);
      const i = d.incomes.find((x) => x.id === id);
      if (!i) return;
      d.incomes = d.incomes.filter((x) => x.id !== id);
      audit(d, user, "Income deleted", `${i.type} — ${fmtMoney(i.amount, d.settings.currency.symbol)}`);
      commit(d, "Income deleted.");
    };

    // ------------------------------------------------------------- SETTINGS / DATA
    const updateSettings = (s: Settings) => {
      const d = clone(db);
      d.settings = s;
      audit(d, user, "Settings updated", "Application settings changed");
      commit(d, "Settings saved.");
    };

    const backup = () => {
      const payload = { app: "MY PHARMACY POS", type: "backup", exportedAt: new Date().toISOString(), db };
      download(`pharmacy-pos-backup-${todayISO()}.json`, JSON.stringify(payload, null, 2), "application/json");
      const d = clone(db);
      audit(d, user, "Backup", "Database backup exported");
      setDb(d);
      toast.success("Backup downloaded.");
    };

    const restore = async (file: File): Promise<string | null> => {
      let text: string;
      try { text = await file.text(); } catch { return "Could not read the backup file."; }
      let parsed: { app?: string; db?: DB };
      try { parsed = JSON.parse(text); } catch { return "Invalid backup file (not valid JSON)."; }
      const data = parsed.db || (parsed as unknown as DB);
      if (!data || !data.version || !Array.isArray(data.products) || !Array.isArray(data.sales))
        return "Invalid backup file (missing database structure).";
      backup(); // automatic backup before restore
      setDb(clone(data));
      setPrintState(null);
      audit(data, user, "Restore", "Database restored from backup file");
      setDb(data);
      toast.success("Database restored.");
      return null;
    };

    const resetDemo = () => {
      const d = buildSeed();
      audit(d, user, "Demo reset", "Demo data re-seeded");
      setDb(d);
      toast.success("Demo data reset.");
    };

    const print = (p: PrintPayload) => setPrintState(p);
    const closePrint = () => setPrintState(null);

    const product = (id: string) => db.products.find((x) => x.id === id);
    const customer = (id: string) => db.customers.find((x) => x.id === id);
    const supplier = (id: string) => db.suppliers.find((x) => x.id === id);
    const batch = (id: string) => db.batches.find((x) => x.id === id);
    const stock = (productId: string) => stockOf(db, productId);

    return {
      db, user, screen, routeData, navTo,
      login, changePassword, logout,
      saveProduct, deleteProduct, saveCustomer, deleteCustomer,
      saveSupplier, deleteSupplier, saveUser, deleteUser, resetPassword,
      holdSale, deleteHold, saveSale, returnSale, alreadyReturned,
      savePurchase, holdPurchase, deletePurchaseDraft, returnPurchase,
      adjustStock, receivePayment, paySupplier,
      addExpense, deleteExpense, addIncome, deleteIncome,
      updateSettings, backup, restore, resetDemo,
      print, printState, closePrint,
      confirmState, confirm,
      resolveConfirm: (v: boolean) => confirmResolve.current?.(v),
      product, customer, supplier, batch, stock,
    };
  }, [db, user, screen, routeData, printState, confirmState, commit, navTo]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePos(): PosApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePos must be used inside PosProvider");
  return ctx;
}
