# ZB SOFTWARE — Pharmacy POS & Inventory System 🏥

A complete, offline-first **pharmacy / medical store management and Point-of-Sale system**
built for Windows desktop use. Every button works, every sale and purchase updates real
stock, and every report is computed from the live database. No internet connection is
required.

Built with **React + TypeScript + Vite**, storing the entire database **locally on the
computer** (persistent across restarts, refreshes and logins), with an **Electron shell**
so it can be packaged as a native Windows desktop app with a real installer.

---

## Quick start

```bash
bun install        # or npm install
bun run dev        # opens the app in the browser (login screen)
```

**Default accounts** — the `admin` account is **forced to change its password on first
login** (the default password is never shown on screen again afterwards):

| Role             | Username  | Password      |
| ---------------- | --------- | ------------- |
| Administrator    | admin     | admin123      |
| Manager          | manager   | manager123    |
| Cashier          | cashier   | cashier123    |
| Inventory Staff  | inventory | inventory123  |

The database is pre-loaded with a **starter dataset** (medicines, suppliers, customers,
batches, purchases, sales, returns, expenses) so the store can be tested immediately.
It is clearly separated from your real data — an administrator can remove it entirely
via **Settings → Database → Remove Starter Data**.

## Branding & logo

The official **ZB SOFTWARE logo** is used on the login screen, the main app sidebar,
the About popup, and at the top of every printed receipt / invoice / report.

To use your own uploaded logo file: place it at **`public/zb-logo.png`** — the app picks
it up automatically everywhere (login, sidebar, About). Until then a clean original
ZB mark (blue + green) is used. A store-specific logo can also be uploaded per store
via **Settings → Pharmacy → Store Logo** (this one appears on printed documents).

**Click the logo** anywhere (sidebar / login / About) for a subtle scale + glow/ripple
animation and the **About ZB Software** popup (version, database status, logged-in user,
copyright).

## Windows desktop app (Electron)

The app is fully functional in the browser, but it is designed to run as a native
Windows application. To package it:

```bash
bun install -D electron electron-builder
npx vite build --base=./
npx electron-builder --win
```

This produces:
- `release/ZB-Software-POS-Setup-1.0.0.exe` — Windows installer (NSIS)
- `release/ZB-Software-POS-Portable-1.0.0.exe` — portable version (no install)

The Electron shell lives in `electron/` (`main.js` + `preload.js`). **Printing is real**:
the print preview renders the exact receipt/invoice/report, then **PRINT** sends it to
your printer through the OS print dialog (thermal 58mm/80mm and A4/A5 paper sizes and
copies are selectable, and your chosen printer names from Settings → Printer are stored
for pre-selection).

## Keyboard shortcuts (keyboard-first operation)

The whole POS can be run without the mouse.

| Key        | Action                        | Key         | Action                    |
| ---------- | ----------------------------- | ----------- | ------------------------- |
| `F1`       | Point of Sale                 | `F8`        | Receipts / Sales history  |
| `F2`       | Search product (add to cart)  | `F9`        | Print receipt             |
| `F3`       | New sale                      | `F10`       | Payment dialog            |
| `F4`       | Customer search               | `F11`       | Fullscreen                |
| `F5`       | Refresh current screen        | `F12`       | Settings (admin)          |
| `F6`       | Purchases                     | `Esc`       | Close dialog / cancel     |
| `F7`       | Inventory                     | `Enter`     | Confirm / select          |
| `↑` / `↓`  | Move search selection         | `Ctrl+F`    | Global search             |
| `Ctrl+S`   | Save (POS / purchase)         | `Ctrl+P`    | Save & print              |
| `Ctrl+N`   | New record (POS: new sale)    | `Ctrl+E`    | Edit selected record      |

**Barcode scanners** work like a keyboard: scanning anywhere on the POS screen finds the
product, picks the correct batch (FEFO — earliest expiry first), checks expiry and
stock, and adds it to the cart. Scanning the same product again increases quantity.

## Core workflows (all wired to the real database)

1. **Login & roles** — roles gate every screen and search result: **Cashier** gets POS,
   sales, returns and receipts; **Inventory Staff** gets products, purchases, inventory
   and stock operations; **Manager** gets sales, purchases, inventory, accounts and
   reports (permissions are configurable by an administrator); **Administrator** gets
   everything plus Users, Settings and Database.
2. **Product Definition** — products with code, SKU, barcode (generate or scan),
   generic/brand, category, pack size, units, prices, min/max/reorder stock, tax,
   discount, control/seasonal flags, active status and rack location. Duplicate codes
   and barcodes are rejected; import/export supported.
3. **Purchases** — items with **batch number + expiry date (mandatory)**, free qty,
   cost/retail, **purchase discount (% or fixed amount)**, loading/freight/other
   expenses, advance & withholding tax. Saving **increases stock**, creates/merges
   batches, updates average cost and the supplier ledger.
4. **POS** — scan/search products, FEFO batch auto-allocation (or pick a batch), edit
   qty/rate/discount, **item discount (% or fixed per unit)** and **receipt discount
   (% or fixed amount)**, additional and advance amounts, pay by **cash / credit /
   cash+credit / card / other**, see change and balance. Saving **decreases stock**,
   updates the customer ledger and cash book, and can print the receipt (F9 / Ctrl+P).
5. **Hold / Retrieve** — pause a sale or purchase and continue later; held records never
   touch stock.
6. **Returns** — sales returns (validated against the sold quantity, restock, reverse
   the customer account, refund by cash/card/credit) and purchase returns (reduce batch
   stock and supplier payables). Return documents print automatically.
7. **Expiry control** — expired batches are **blocked from sale** (unless an admin
   explicitly enables it with a password confirmation), highlighted in red, and bucketed
   into ≤7 / ≤30 / ≤60 / ≤90 day windows on the dashboard, inventory and expiry report.
8. **Stock operations** — adjustment, damaged stock, expired stock and supplier returns
   are all recorded as typed stock movements with an audit trail.
9. **Reports** — daily/weekly/monthly/yearly sales, sales by product/category/customer/
   cashier, **sales discount**, **purchase discount**, purchases, profit (real cost vs
   real selling price), stock, low stock, expiry, tax, customer & supplier ledgers,
   **customer credit**, **supplier balances**, expenses, income and cash book — with
   date filters, search, sorting, printing and CSV export.
10. **Backup / Restore** — one-click JSON backup; restore requires the administrator
    password, asks for confirmation, and automatically backs up the current database
    first.

## Security

- Destructive and sensitive operations (**restore, deleting users/products/customers/
  suppliers, removing starter data, enabling expired sales, permission changes**) ask
  for the **administrator password** first.
- Passwords are never displayed anywhere in the app (only "set / must change" states).
- Every important action — login, logout, product/sale/purchase/stock changes, backups,
  restores — is written to the **Audit Log** (Settings → Audit Log).

## Product import format

Settings → Products → Import accepts a JSON array:

```json
[
  { "name": "Panadol Extra 500mg", "code": "PDT-1001", "barcode": "8961002001001",
    "generic": "Paracetamol + Caffeine", "category": "Analgesics",
    "purchasePrice": 45, "retailPrice": 60, "minStock": 20 }
]
```

## Notes on persistence & environment

- The database lives entirely on the machine running the app and **survives closing the
  application, browser refreshes, restarts and logins**. In the web build it persists in
  the browser's local storage; in the packaged Electron build it is backed by a file on
  disk (see `electron/` for the persistence bridge point).
- Printing uses the OS print dialog, which is real printing in both the browser and the
  packaged Windows app.
- This repository also contains other (Zorbi) app code — the POS loads at `/`; the
  other files are left untouched.
