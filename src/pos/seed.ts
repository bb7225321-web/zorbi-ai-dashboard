// ============================================================================
// ZB SOFTWARE — starter dataset (created once on first run).
// This is real, working data so the store can be tested immediately. An
// administrator can remove it entirely from Settings → Database.
// ============================================================================
import {
  DB, Product, User, Customer, Supplier, Sale, Purchase, Batch,
  todayISO, addDays, uid, bumpNo, calcSaleTotals, calcPurchaseTotals, lineTotal,
  addLedgerEntry, addCashEntry, WALKIN_ID, round2, DEFAULT_PERMS,
} from "./core";

let p = 0;
function P(partial: Partial<Product>): Product {
  p += 1;
  return {
    id: "p" + p, code: `PDT-${1000 + p}`, sku: `SKU-${1000 + p}`, barcode: "", altBarcode: "",
    name: "", generic: "", brand: "", category: "", subCategory: "", group: "",
    supplierId: "", type: "Medicine", control: false, seasonal: false,
    unit: "Tab", purchaseUnit: "Tab", conversion: 1, packSize: "10s",
    avgCost: 0, purchasePrice: 0, retailPrice: 0, wholesalePrice: 0,
    minStock: 20, optStock: 60, maxStock: 120, reorderLevel: 20,
    taxPct: 0, discountPct: 0, location: "Rack A", notes: "",
    active: true, createdAt: todayISO(), ...partial,
  };
}

export function buildSeed(): DB {
  const db: DB = {
    version: 2, sampleData: true,
    users: [], products: [], batches: [], customers: [], suppliers: [],
    sales: [], purchases: [], saleReturns: [], purchaseReturns: [],
    cLedger: [], sLedger: [], cash: [], expenses: [], incomes: [],
    adjustments: [], audit: [], counters: {},
    settings: {
      pharmacy: {
        name: "ZB Software Pharmacy",
        address: "Shop #12, Main Bazaar Road, Lahore",
        phone: "+92 300 1234567",
        email: "info@zbsoftware.example",
        license: "DRAP-LIC-000123",
        footer: "Thank you for shopping with us. Get well soon!",
        logo: "",
      },
      currency: { code: "PKR", symbol: "₨" },
      tax: { salesTaxPct: 5, purchaseTaxPct: 0 },
      receipt: { paper: "80mm", copies: 1, header: "Store hours: Mon–Sat 9AM–10PM", footer: "Goods once sold are not returnable without receipt.", showLogo: true },
      printer: { defaultName: "", thermalName: "", a4Name: "" },
      inventory: { expiryWarningDays: 30, lowStockThreshold: 0 },
      security: { allowExpiredSales: false },
      appearance: "dark",
    },
  };

  // ---- users ---------------------------------------------------------------
  db.users.push(
    { id: "u1", username: "admin", name: "Store Administrator", password: "admin123", role: "admin", perms: [...DEFAULT_PERMS.admin], active: true, mustChange: true, createdAt: todayISO() },
    { id: "u2", username: "manager", name: "Sara Ahmed", password: "manager123", role: "manager", perms: [...DEFAULT_PERMS.manager], active: true, mustChange: false, createdAt: todayISO() },
    { id: "u3", username: "cashier", name: "Bilal Khan", password: "cashier123", role: "cashier", perms: [...DEFAULT_PERMS.cashier], active: true, mustChange: false, createdAt: todayISO() },
    { id: "u4", username: "inventory", name: "Hamza Tariq", password: "inventory123", role: "inventory", perms: [...DEFAULT_PERMS.inventory], active: true, mustChange: false, createdAt: todayISO() },
  );

  // ---- suppliers ------------------------------------------------------------
  const sup = (id: string, name: string, cp: string, phone: string, ob: number) =>
    db.suppliers.push({ id, name, contactPerson: cp, phone, address: "Lahore, Pakistan", email: "", openingBalance: ob, balance: ob, notes: "", createdAt: todayISO() });
  sup("s1", "Medix Pharma", "Rashid Mahmood", "+92 301 1111111", 0);
  sup("s2", "Global Medicines", "Kashif Ali", "+92 302 2222222", 0);
  sup("s3", "City Traders", "Noman Butt", "+92 303 3333333", 0);
  sup("s4", "Al-Karim Agencies", "Usman Rafiq", "+92 304 4444444", 0);

  // ---- customers ------------------------------------------------------------
  db.customers.push(
    { id: WALKIN_ID, name: "Walk-in Customer", phone: "", cnic: "", address: "", email: "", creditLimit: 0, openingBalance: 0, balance: 0, notes: "Default cash customer", createdAt: todayISO() },
    { id: "c1", name: "Ali Hassan", phone: "+92 321 5555555", cnic: "35201-1234567-1", address: "Gulberg III, Lahore", email: "ali.h@example.com", creditLimit: 5000, openingBalance: 0, balance: 0, notes: "Credit customer", createdAt: todayISO() },
    { id: "c2", name: "Fatima Noor", phone: "+92 322 6666666", cnic: "", address: "DHA Phase 6", email: "", creditLimit: 3000, openingBalance: 0, balance: 0, notes: "", createdAt: todayISO() },
  );

  // ---- products -------------------------------------------------------------
  const cat = (name: string, sub: string, grp: string) => ({ category: name, subCategory: sub, group: grp });
  db.products.push(
    P({ name: "Panadol Extra 500mg", generic: "Paracetamol + Caffeine", brand: "GSK", barcode: "8961002001001", altBarcode: "PNE500", ...cat("Analgesics", "Pain Relief", "Tablets"), supplierId: "s1", unit: "Tab", purchasePrice: 45, retailPrice: 60, wholesalePrice: 52, avgCost: 45, minStock: 40, optStock: 120, maxStock: 300, reorderLevel: 40, location: "A1" }),
    P({ name: "Disprin 300mg", generic: "Aspirin", brand: "Reckitt", barcode: "8961002001002", ...cat("Analgesics", "Pain Relief", "Tablets"), supplierId: "s1", unit: "Tab", purchasePrice: 8, retailPrice: 12, wholesalePrice: 10, avgCost: 8, minStock: 50, optStock: 200, maxStock: 400, reorderLevel: 50, location: "A1" }),
    P({ name: "Brufen 400mg", generic: "Ibuprofen", brand: "Abbott", barcode: "8961002001003", ...cat("Analgesics", "Anti-inflammatory", "Tablets"), supplierId: "s2", unit: "Tab", purchasePrice: 30, retailPrice: 42, wholesalePrice: 36, avgCost: 30, minStock: 30, optStock: 100, maxStock: 250, reorderLevel: 30, location: "A2" }),
    P({ name: "Amoxil 250mg", generic: "Amoxicillin", brand: "GSK", barcode: "8961002001004", altBarcode: "AMX250", ...cat("Antibiotics", "Penicillins", "Capsules"), supplierId: "s1", unit: "Cap", purchasePrice: 55, retailPrice: 75, wholesalePrice: 64, avgCost: 55, control: true, minStock: 25, optStock: 80, maxStock: 200, reorderLevel: 25, location: "B1 (Cold)" }),
    P({ name: "Augmentin 625mg", generic: "Amoxicillin + Clavulanate", brand: "GSK", barcode: "8961002001005", ...cat("Antibiotics", "Penicillins", "Tablets"), supplierId: "s1", unit: "Tab", purchasePrice: 120, retailPrice: 160, wholesalePrice: 138, avgCost: 120, control: true, minStock: 20, optStock: 60, maxStock: 150, reorderLevel: 20, location: "B1" }),
    P({ name: "Zyrtec 10mg", generic: "Cetirizine", brand: "GSK", barcode: "8961002001006", ...cat("Antihistamines", "Allergy", "Tablets"), supplierId: "s2", unit: "Tab", purchasePrice: 35, retailPrice: 48, wholesalePrice: 41, avgCost: 35, minStock: 30, optStock: 90, maxStock: 220, reorderLevel: 30, location: "A3" }),
    P({ name: "Ventolin Inhaler 100mcg", generic: "Salbutamol", brand: "GSK", barcode: "8961002001007", ...cat("Respiratory", "Bronchodilators", "Inhalers"), supplierId: "s3", unit: "Pcs", purchasePrice: 380, retailPrice: 520, wholesalePrice: 450, avgCost: 380, minStock: 10, optStock: 25, maxStock: 60, reorderLevel: 10, location: "C2" }),
    P({ name: "Vitamin C 500mg", generic: "Ascorbic Acid", brand: "NutriPlus", barcode: "8961002001008", ...cat("Vitamins", "Supplements", "Tablets"), supplierId: "s4", unit: "Tab", purchasePrice: 15, retailPrice: 22, wholesalePrice: 18, avgCost: 15, minStock: 60, optStock: 200, maxStock: 500, reorderLevel: 60, location: "D1", seasonal: true }),
    P({ name: "ORS Sachet", generic: "Oral Rehydration Salts", brand: "Nestle", barcode: "8961002001009", ...cat("Gastro", "Rehydration", "Sachets"), supplierId: "s3", unit: "Sachet", purchasePrice: 6, retailPrice: 10, wholesalePrice: 8, avgCost: 6, minStock: 100, optStock: 300, maxStock: 800, reorderLevel: 100, location: "D2", seasonal: true }),
    P({ name: "Flagyl 400mg", generic: "Metronidazole", brand: "Sanofi", barcode: "8961002001010", ...cat("Antibiotics", "Antiprotozoals", "Tablets"), supplierId: "s2", unit: "Tab", purchasePrice: 25, retailPrice: 35, wholesalePrice: 30, avgCost: 25, minStock: 40, optStock: 120, maxStock: 300, reorderLevel: 40, location: "B2" }),
  );

  // ---- purchases (5 days and 2 days ago) ------------------------------------
  const pur1: Purchase = {
    id: uid(), no: bumpNo(db, "PUR"), supplierId: "s1", supplierName: "Medix Pharma",
    invoiceNo: "INV-8841", billNo: "BL-120", billDate: addDays(todayISO(), -6), dueDate: addDays(todayISO(), 24),
    date: addDays(todayISO(), -5), time: "11:20", mode: "Credit", comments: "Weekly order", items: [],
    subTotal: 0, discountType: "pct", discountValue: 0, discount: 0, loading: 0, freight: 0, other: 0, additional: 0, tax: 0, advanceTax: 0, withTax: 0, total: 0,
    status: "final", returned: false, userId: "u1", userName: "Store Administrator", createdAt: addDays(todayISO(), -5),
  };
  const pur2: Purchase = {
    id: uid(), no: bumpNo(db, "PUR"), supplierId: "s2", supplierName: "Global Medicines",
    invoiceNo: "INV-9102", billNo: "BL-451", billDate: addDays(todayISO(), -3), dueDate: addDays(todayISO(), 27),
    date: addDays(todayISO(), -2), time: "15:45", mode: "Cash", comments: "", items: [],
    subTotal: 0, discountType: "amt", discountValue: 0, discount: 0, loading: 0, freight: 0, other: 0, additional: 0, tax: 0, advanceTax: 0, withTax: 0, total: 0,
    status: "final", returned: false, userId: "u1", userName: "Store Administrator", createdAt: addDays(todayISO(), -2),
  };

  // ---- batches (net quantities already reflect purchases minus sales) -------
  const mkBatch = (productId: string, batchNo: string, exp: string, qty: number, cost: number, salePrice: number, supplierId: string, purchaseId: string, mfg?: string) =>
    db.batches.push({ id: uid(), productId, batchNo, mfgDate: mfg || addDays(exp, -730), expDate: exp, qty, cost, salePrice, supplierId, purchaseId, createdAt: todayISO() });

  const T = todayISO();
  mkBatch("p1", "PNE-2601", addDays(T, 320), 110, 45, 60, "s1", pur1.id);
  mkBatch("p1", "PNE-2590", addDays(T, -15), 12, 45, 60, "s1", pur1.id);           // EXPIRED
  mkBatch("p2", "DSP-1102", addDays(T, 5), 90, 8, 12, "s1", pur1.id);              // expiring in 5 days
  mkBatch("p3", "BRF-3304", addDays(T, 400), 70, 30, 42, "s2", pur2.id);
  mkBatch("p4", "AMX-7712", addDays(T, 25), 40, 55, 75, "s1", pur1.id);            // near expiry
  mkBatch("p5", "AUG-9920", addDays(T, 260), 24, 120, 160, "s1", pur1.id);
  mkBatch("p6", "ZRT-1120", addDays(T, 55), 36, 35, 48, "s2", pur2.id);            // within 60 days
  mkBatch("p7", "VNT-3301", addDays(T, 540), 8, 380, 520, "s3", pur2.id);
  mkBatch("p8", "VTC-8805", addDays(T, 300), 150, 15, 22, "s4", pur2.id);
  mkBatch("p9", "ORS-2210", addDays(T, 200), 260, 6, 10, "s3", pur2.id);
  mkBatch("p10", "FLG-4410", addDays(T, 340), 55, 25, 35, "s2", pur2.id);

  const b = (idx: number) => db.batches[idx];

  const addPurItem = (pur: Purchase, productId: string, batchIdx: number, qty: number, freeQty: number, cost: number, retail: number) => {
    const prod = db.products.find((x) => x.id === productId)!;
    const bt = b(batchIdx);
    const { discount, tax, total } = lineTotal(cost, qty, "pct", 0, 0);
    pur.items.push({
      id: uid(), productId, productName: prod.name, generic: prod.generic,
      batchNo: bt.batchNo, mfgDate: bt.mfgDate, expDate: bt.expDate,
      qty, freeQty, cost, retail, discountPct: 0, taxPct: 0, discount, tax, total,
    });
  };
  addPurItem(pur1, "p1", 0, 120, 5, 45, 60);
  addPurItem(pur1, "p2", 2, 100, 0, 8, 12);
  addPurItem(pur1, "p4", 3, 45, 0, 55, 75);
  addPurItem(pur1, "p5", 4, 30, 0, 120, 160);
  const t1 = calcPurchaseTotals(pur1.items, 0, 0, 0, 0, 0, { type: "pct", value: 0 }, 0, 0);
  pur1.subTotal = t1.subTotal; pur1.total = t1.total;
  db.purchases.push(pur1);
  addCashEntry(db, pur1.date, `Purchase ${pur1.no} (${pur1.supplierName}) — paid`, 0, 0); // credit: no cash out

  addPurItem(pur2, "p3", 4, 80, 0, 30, 42);
  addPurItem(pur2, "p6", 5, 40, 0, 35, 48);
  addPurItem(pur2, "p7", 6, 10, 0, 380, 520);
  addPurItem(pur2, "p8", 7, 200, 10, 15, 22);
  addPurItem(pur2, "p9", 8, 300, 0, 6, 10);
  addPurItem(pur2, "p10", 9, 60, 0, 25, 35);
  const t2 = calcPurchaseTotals(pur2.items, 200, 150, 0, 0, 0, { type: "amt", value: 0 }, 0, 0);
  pur2.subTotal = t2.subTotal; pur2.total = t2.total;
  db.purchases.push(pur2);
  addCashEntry(db, pur2.date, `Purchase ${pur2.no} (${pur2.supplierName}) — paid`, 0, t2.total);
  addLedgerEntry(db, "s", "s2", "Global Medicines", pur2.date, pur2.no, "invoice", 0, t2.total, "Purchase");
  addLedgerEntry(db, "s", "s1", "Medix Pharma", pur1.date, pur1.no, "invoice", 0, t1.total, "Purchase (credit)");
  addLedgerEntry(db, "s", "s2", "Global Medicines", pur2.date, "PAY-0001", "payment", t2.total, 0, "Paid in full");

  // ---- sales ----------------------------------------------------------------
  const mkSaleItem = (productId: string, batchIdx: number, qty: number, rate?: number) => {
    const prod = db.products.find((x) => x.id === productId)!;
    const bt = b(batchIdx);
    const r = rate ?? bt.salePrice;
    const taxPct = prod.taxPct || db.settings.tax.salesTaxPct;
    return {
      id: uid(), productId, productName: prod.name, generic: prod.generic,
      batchId: bt.id, batchNo: bt.batchNo, expDate: bt.expDate, unit: prod.unit,
      rate: r, qty, discountType: "pct" as const, discountValue: 0, taxPct, discount: 0, tax: 0, total: 0, cost: bt.cost,
    };
  };

  const buildSale = (
    daysAgo: number, time: string, customerId: string, customerName: string,
    lines: ReturnType<typeof mkSaleItem>[], method: Sale["method"], paid?: number,
  ): Sale => {
    const totals = calcSaleTotals(lines, { type: "pct", value: 0 }, 0, 0, db.settings.tax.salesTaxPct);
    lines.forEach((l, i) => {
      const lt = lineTotal(l.rate, l.qty, l.discountType, l.discountValue, l.taxPct);
      l.discount = lt.discount; l.tax = lt.tax; l.total = lt.total;
      l.tax = totals.lineTax[i];
      l.total = round2(l.rate * l.qty + l.tax);
    });
    const net = totals.net;
    const isCash = method === "cash" || method === "cash+credit";
    const sale: Sale = {
      id: uid(), no: bumpNo(db, "SALE"), date: addDays(todayISO(), -daysAgo), time,
      customerId, customerName, customerPhone: "", cashierId: "u3", cashierName: "Bilal Khan",
      items: lines, gross: totals.gross, itemDisc: 0, receiptDiscType: "pct", receiptDiscValue: 0, receiptDisc: 0,
      tax: totals.tax, additional: 0, advance: 0, net,
      method, paid: isCash ? (paid ?? net) : 0, change: isCash ? round2((paid ?? net) - net) : 0,
      balance: isCash ? 0 : net, status: "final", returned: false, notes: "", createdAt: addDays(todayISO(), -daysAgo),
    };
    db.sales.push(sale);
    if (isCash) addCashEntry(db, sale.date, `Sale ${sale.no} — cash`, sale.paid, 0);
    else addLedgerEntry(db, "c", customerId, customerName, sale.date, sale.no, "invoice", net, 0, "Credit sale");
    return sale;
  };

  const sToday = buildSale(0, "10:05", WALKIN_ID, "Walk-in Customer", [
    mkSaleItem("p1", 0, 4),
    mkSaleItem("p6", 5, 2),
    mkSaleItem("p8", 7, 5),
  ], "cash");
  void sToday;
  const sYest = buildSale(1, "16:30", "c1", "Ali Hassan", [mkSaleItem("p5", 4, 2), mkSaleItem("p10", 9, 3)], "credit");
  buildSale(3, "12:15", "c2", "Fatima Noor", [mkSaleItem("p3", 4, 2), mkSaleItem("p9", 8, 6)], "cash");

  // payment received from Ali today
  addLedgerEntry(db, "c", "c1", "Ali Hassan", T, "PAY-0001", "payment", 0, 500, "Payment received");
  addCashEntry(db, T, "Payment received from Ali Hassan", 500, 0);

  // ---- sale return (1 qty of yesterday's Augmentin) -------------------------
  const srItems = sYest.items.filter((i) => i.productId === "p5").map((i) => ({
    id: uid(), productId: i.productId, productName: i.productName, batchId: i.batchId,
    batchNo: i.batchNo, expDate: i.expDate, qty: 1, rate: i.rate, cost: i.cost,
    discount: 0, total: round2(i.rate * 1),
  }));
  db.saleReturns.push({
    id: uid(), no: bumpNo(db, "SRET"), saleId: sYest.id, saleNo: sYest.no,
    customerId: "c1", customerName: "Ali Hassan", date: T,
    items: srItems, total: srItems.reduce((s, i) => s + i.total, 0),
    method: "Credit to Account", note: "Damaged blister", userId: "u3", userName: "Bilal Khan",
  });
  sYest.returned = true;
  const retBatch = db.batches.find((x) => x.id === srItems[0].batchId)!;
  retBatch.qty = round2(retBatch.qty + 1);
  addLedgerEntry(db, "c", "c1", "Ali Hassan", T, sYest.no, "return", 0, srItems[0].total, "Sales return");
  addCashEntry(db, T, `Sales return ${db.saleReturns[0].no}`, 0, 0); // credit — no cash out

  // ---- expenses / income ----------------------------------------------------
  db.expenses.push(
    { id: uid(), date: addDays(T, -2), category: "Rent", description: "Shop rent (August)", amount: 40000, method: "Bank Transfer", note: "" },
    { id: uid(), date: addDays(T, -1), category: "Electricity", description: "WAPDA bill", amount: 12000, method: "Cash", note: "" },
  );
  addCashEntry(db, addDays(T, -2), "Expense — Shop rent", 0, 40000);
  addCashEntry(db, addDays(T, -1), "Expense — WAPDA bill", 0, 12000);
  db.incomes.push({ id: uid(), date: T, type: "Commission", description: "Distributor commission", amount: 2500, method: "Cash", note: "" });
  addCashEntry(db, T, "Income — Commission", 2500, 0);

  // ---- opening cash + audit --------------------------------------------------
  db.cash.unshift({ id: uid(), date: addDays(T, -6), desc: "Opening Balance", in: 50000, out: 0, balance: 50000 });
  let run = 0;
  db.cash.forEach((e) => { run = round2(run + e.in - e.out); e.balance = run; });

  db.audit.push(
    { id: uid(), date: addDays(T, -6), time: "09:00", userId: "u1", userName: "Store Administrator", action: "Install", detail: "Application installed — starter dataset created" },
    { id: uid(), date: T, time: "10:05", userId: "u3", userName: "Bilal Khan", action: "Sale created", detail: `${sToday.no} — ${sToday.items.length} items` },
  );

  db.counters.PAY = 1;
  return db;
}
