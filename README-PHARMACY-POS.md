# MY PHARMACY POS 🏥

A complete, offline-first **pharmacy / medical store management and Point-of-Sale system**.
Every button works, every sale and purchase updates real stock, and every report is
computed from the live database. No internet connection is required.

The application is built with **React + TypeScript + Vite**, stores its entire database
**locally on the computer** (browser localStorage in the web preview, SQLite-style JSON
persistence), and ships with an **Electron shell** so it can be packaged as a native
Windows desktop app with a real Windows installer.

---

## Quick start

```bash
bun install        # or npm install
bun run dev        # opens the app in the browser (login screen)
```

**Default accounts** (the `admin` account is forced to change its password on first login):

| Role          | Username | Password    |
| ------------- | -------- | ----------- |
| Administrator | admin    | admin123    |
| Manager       | manager  | manager123  |
| Cashier       | cashier  | cashier123  |

The database is pre-loaded with **DEMO DATA** (medicines, suppliers, customers, batches,
purchases, sales, returns, expenses) so you can test every workflow immediately.
Reset it anytime via **Settings → Database → Reset Demo Data**.

## Windows desktop app (Electron)

The app is fully functional in the browser, but it is designed to run as a native
Windows application. To package it:

```bash
bun install -D electron electron-builder
npx vite build --base=./
npx electron-builder --win
```

This produces:
- `release/My-Pharmacy-POS-Setup-1.0.0.exe` — Windows installer (NSIS)
- `release/My-Pharmacy-POS-Portable-1.0.0.exe` — portable version (no install)

The Electron shell lives in `electron/` (`main.js` + `preload.js`). Printing uses the
**real Windows printer system** via the OS print dialog — thermal 58mm/80mm and A4/A5
are supported through the print preview (paper size and copies are selectable).

> Note: for `file://` loading of the built app the Vite build must use a relative base
> (`--base=./`), which the command above does. The dev server does not need it.

## Key workflows (all verified against the real database)

1. **Login** → roles gate access (cashier sees POS + customers only; manager gets
   sales, purchases, inventory, reports; admin gets everything).
2. **Product Definition** — create products with code, barcode (generate or scan),
   generic/brand, category, supplier, control/seasonal flags, units, prices, min/opt/max
   stock, tax, discount, rack location.
3. **Purchases** — add items with **batch number + expiry date (mandatory)**, free qty,
   cost/retail, loading/freight/other expenses, advance & withholding tax. Saving
   **increases stock**, creates/merges batches, and updates the supplier ledger.
4. **POS** — scan a barcode (keyboard-wedge scanners work like a keyboard), search
   products, pick batches with **FEFO auto-allocation**, edit qty/rate/discount,
   receipt discount, advance, additional amounts, and pay by cash / credit /
   cash+credit / card / other. Saving **decreases stock**, updates the customer ledger,
   and can print the receipt.
5. **Hold / Retrieve** — pause a sale or purchase and continue later; held items never
   touch stock.
6. **Returns** — sales returns (validate against sold quantity, restock, reverse the
   customer account) and purchase returns (restock the supplier, reduce payables).
   Return receipts print automatically.
7. **Expiry control** — expired batches are blocked from sale (unless enabled in
   Settings → Security), highlighted in red, and bucketed into ≤7 / ≤30 / ≤60 / ≤90
   day windows on the dashboard and expiry report.
8. **Reports** — sales (by day/product/category/customer/cashier), purchases, stock,
   low stock, expiry, profit, tax, customer & supplier ledgers, expenses, income and
   cash book — all with date ranges, printing and CSV export.
9. **Backup / Restore** — one-click JSON backup download; restore asks for
   confirmation and automatically backs up the current database first.

## Keyboard shortcuts

| Key           | Action                     | Key     | Action                    |
| ------------- | -------------------------- | ------- | ------------------------- |
| `F1`          | New sale                   | `F7`    | Print receipt             |
| `F2`          | Product search             | `F8`    | Search receipts           |
| `F4`          | Hold sale                  | `F9`    | Payment dialog            |
| `F5`          | Retrieve held sale         | `Esc`   | Close dialog / clear      |
| `F6`          | New purchase               | `Ctrl+S`| Save (POS / purchase)     |
| `Ctrl+F`      | Global search              | `Ctrl+P`| Save & print              |

## Product import format

Settings → Products → Import accepts a JSON array:

```json
[
  { "name": "Panadol Extra 500mg", "code": "PDT-1001", "barcode": "8961002001001",
    "generic": "Paracetamol + Caffeine", "category": "Analgesics",
    "purchasePrice": 45, "retailPrice": 60, "minStock": 20 }
]
```

## Notes on persistence & security

- The database is stored entirely on the machine running the app (localStorage in the
  web build; this maps to a file on disk in a production Electron build).
- Passwords in this demo build are stored for evaluation; a production build should
  hash them (the structure supports it via `hashPw` in `src/pos/core.ts`).
- Every important action (login, sale, purchase, adjustment, backup, restore) is
  written to the **Audit Log** (Settings → Audit Log).
