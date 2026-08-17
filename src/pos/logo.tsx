// ============================================================================
// ZB SOFTWARE — brand logo & About dialog
//
// The official logo: drop the uploaded logo file into `public/zb-logo.png`
// and it is used automatically everywhere (login, sidebar, receipts, About).
// Until then, a clean original ZB mark (blue + green) is used as the fallback.
// ============================================================================
import type { ReactNode } from "react";
import { Database, User as UserIcon, CircleCheck } from "lucide-react";
import { usePos } from "./store";
import { Modal, Btn } from "./ui";
import { APP_NAME, APP_SUBTITLE, APP_VERSION, APP_COPYRIGHT, ROLE_LABEL } from "./core";

/** Inline SVG mark used when the uploaded logo file is not present. */
export function zbMarkSVG(size = 40, rounded = true): string {
  const rx = rounded ? 10 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="zbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d6ff2"/>
      <stop offset="0.55" stop-color="#0e46c9"/>
      <stop offset="1" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="zbg2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b82f6"/>
      <stop offset="1" stop-color="#34d399"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="${rx}" fill="url(#zbg)"/>
  <rect x="2.5" y="2.5" width="59" height="59" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
  <path d="M14 20 h10 l8 24 l8 -24 h10" fill="none" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M40 46 c6 -4 10 -7 10 -12 c0 -3 -2 -5 -5 -5 c-3 0 -5 2 -5 5 c0 -3 -2 -5 -5 -5 c-3 0 -5 2 -5 5 c0 5 4 8 10 12 z" fill="url(#zbg2)"/>
  <circle cx="50" cy="47" r="3" fill="#34d399"/>
</svg>`;
}

/** React version of the mark (used in the UI shell). */
export function ZBMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: zbMarkSVG(size) }}
    />
  );
}

export function ZBLogoWord({ light }: { light?: boolean }) {
  return (
    <div className="leading-tight">
      <div className={`text-sm font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900 dark:text-white"}`}>
        ZB <span className="text-sky-500">SOFTWARE</span>
      </div>
      <div className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${light ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"}`}>
        Pharmacy POS &amp; Inventory
      </div>
    </div>
  );
}

/** Full logo lockup (mark + wordmark) with click animation and About popup. */
export function ZBLogoLockup({
  size = 40, light, onClick, subtitle = "Pharmacy POS & Inventory System",
}: { size?: number; light?: boolean; onClick?: () => void; subtitle?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="ZB SOFTWARE — click for app info"
      className="zb-logo group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <span className="zb-logo-mark relative inline-flex">
        <ZBMark size={size} />
        <span className="zb-logo-ripple" aria-hidden />
      </span>
      <span className="text-left">
        <span className={`block text-base font-extrabold tracking-tight ${light ? "text-white" : "text-slate-900 dark:text-white"}`}>
          ZB <span className="text-sky-500">SOFTWARE</span>
        </span>
        <span className={`block text-[9px] font-semibold uppercase tracking-[0.16em] ${light ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"}`}>
          {subtitle}
        </span>
      </span>
    </button>
  );
}

/** The plain mark used inside receipts / printed documents (inline SVG string). */
export function printLogoHTML(size = 44, storeName: string, storeLogo?: string): string {
  if (storeLogo) return `<img src="${storeLogo}" alt="logo" style="width:${size}px;height:${size}px;object-fit:contain;" />`;
  const inline = zbMarkSVG(size, true);
  return `<div style="text-align:center;">${inline}</div>`;
}

// ---------------------------------------------------------------------------
// About dialog
// ---------------------------------------------------------------------------
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, user } = usePos();
  if (!open) return null;
  const data = {
    products: db.products.length,
    batches: db.batches.length,
    sales: db.sales.filter((s) => s.status === "final").length,
    purchases: db.purchases.filter((p) => p.status === "final").length,
    customers: db.customers.length,
    suppliers: db.suppliers.length,
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" title="About ZB Software"
      footer={<Btn variant="outline" onClick={onClose}>Close</Btn>}>
      <div className="flex flex-col items-center text-center">
        <span className="zb-logo-mark relative inline-flex">
          <ZBMark size={72} />
          <span className="zb-logo-ripple" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          ZB <span className="text-sky-500">SOFTWARE</span>
        </h2>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
          {APP_SUBTITLE}
        </p>
        <p className="mt-1 text-xs text-slate-400">Version {APP_VERSION}</p>

        <div className="mt-5 w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs dark:border-slate-700 dark:bg-slate-800/60">
          <Row icon={<CircleCheck className="size-3.5 text-emerald-500" />} k="Database status" v="Connected · stored locally on this computer" />
          <Row icon={<Database className="size-3.5 text-sky-500" />} k="Records" v={`${data.products} products · ${data.batches} batches · ${data.sales} sales · ${data.purchases} purchases`} />
          <Row icon={<UserIcon className="size-3.5 text-indigo-500" />} k="Logged in as" v={`${user?.name || "—"} · ${ROLE_LABEL[user?.role || "admin"]}`} />
          <Row icon={<Database className="size-3.5 text-slate-400" />} k="Sample data" v={db.sampleData ? "Starter dataset present (removable in Settings → Database)" : "None"} />
        </div>
        <p className="mt-4 text-[11px] text-slate-400">{APP_COPYRIGHT}</p>
      </div>
    </Modal>
  );
}

function Row({ icon, k, v }: { icon: ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{k}: </span>
        <span className="text-slate-500 dark:text-slate-400">{v}</span>
      </span>
    </div>
  );
}
