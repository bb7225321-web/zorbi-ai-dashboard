// ============================================================================
// MY PHARMACY POS — shared UI kit
// ============================================================================
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtMoney } from "./core";

// ------------------------------------------------------------------ buttons
type BtnVariant = "primary" | "success" | "danger" | "outline" | "ghost" | "dark" | "warn";
const btnStyles: Record<BtnVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20",
  success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/20",
  danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-sm shadow-rose-600/20",
  warn: "bg-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-500/20",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  dark: "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
};

export function Btn({
  variant = "primary", icon, loading, className, children, size = "md", ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant; icon?: ReactNode; loading?: boolean; size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-8 px-2.5 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-11 px-5 text-sm gap-2" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150",
        "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap",
        btnStyles[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconBtn({
  icon, label, onClick, tone = "default", className,
}: { icon: ReactNode; label: string; onClick?: () => void; tone?: "default" | "danger" | "primary"; className?: string }) {
  const tones = {
    default: "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
    danger: "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40",
    primary: "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
  };
  return (
    <button
      type="button" title={label} aria-label={label} onClick={onClick}
      className={cn("inline-flex size-8 items-center justify-center rounded-lg transition-colors", tones[tone], className)}
    >
      {icon}
    </button>
  );
}

// ------------------------------------------------------------------ layout
export function Page({ title, subtitle, actions, children, wide }: {
  title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-8", wide ? "max-w-[1600px]" : "max-w-[1400px]")}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, actions, children, className, pad = true }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]",
      "dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
      className,
    )}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {actions}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </div>
  );
}

// ------------------------------------------------------------------ modal
export function Modal({ open, onClose, title, subtitle, children, footer, size = "lg", staticBackdrop }: {
  open: boolean; onClose: () => void; title?: ReactNode; subtitle?: ReactNode;
  children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl" | "full"; staticBackdrop?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl", full: "max-w-[96vw]" };
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:py-10"
      onMouseDown={staticBackdrop ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={cn("w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 animate-in fade-in-0 zoom-in-95", sizes[size])}>
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <IconBtn icon={<X className="size-4" />} label="Close" onClick={onClose} />
          </div>
        )}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ------------------------------------------------------------------ forms
export function Field({ label, required, hint, children, className }: {
  label: string; required?: boolean; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 " +
  "outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 " +
  "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";

export function Inp({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, className)} {...rest} />;
}
export function Txta({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-[70px]", className)} {...rest} />;
}
export function Sel({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputCls, "appearance-none pr-8 bg-no-repeat bg-[right_0.6rem_center] bg-[length:14px] dark:bg-slate-800",
    className)} {...rest}>{children}</select>;
}
export function Num({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" step="any" className={cn(inputCls, className)} {...rest} />;
}
export function DateInp({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" className={cn(inputCls, className)} {...rest} />;
}

// ------------------------------------------------------------------ misc
export function Money({ v, symbol, className }: { v: number; symbol?: string; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{fmtMoney(v, symbol)}</span>;
}

export type Tone = "slate" | "blue" | "green" | "amber" | "red" | "violet" | "orange";
const toneCls: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  red: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
};
export function Tag({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", toneCls[tone], className)}>
      {children}
    </span>
  );
}

export function Stat({ icon, label, value, sub, tone, onClick }: {
  icon: ReactNode; label: string; value: ReactNode; sub?: string;
  tone: { bg: string; text?: string; bar: string }; onClick?: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] active:scale-[0.98]",
        "dark:border-slate-800 dark:bg-slate-900",
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex size-11 items-center justify-center rounded-xl", tone.bg, tone.text)}>{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
      <div className={cn("absolute inset-x-0 bottom-0 h-1", tone.bar)} />
    </button>
  );
}

export function Seg<T extends string>({ options, value, onChange, className }: {
  options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800", className)}>
      {options.map((o) => (
        <button
          key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            value === o.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        {icon}
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

// ------------------------------------------------------------------ table
export interface Col<T> {
  key: string; label: ReactNode; render?: (row: T) => ReactNode;
  sort?: (row: T) => number | string; align?: "left" | "right" | "center";
  className?: string; hide?: (row: T) => boolean;
}
export function TableX<T>({ cols, rows, rowKey, pageSize = 10, onRowClick, onRowDoubleClick, rowClass, footer, empty }: {
  cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; pageSize?: number;
  onRowClick?: (r: T) => void; onRowDoubleClick?: (r: T) => void; rowClass?: (r: T) => string;
  footer?: ReactNode; empty?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const col = cols.find((c) => c.key === sortKey);
    if (!col?.sort) return rows;
    const dir = sortDir;
    return [...rows].sort((a, b) => {
      const va = col.sort!(a); const vb = col.sort!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [rows, cols, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = sorted.slice((cur - 1) * pageSize, cur * pageSize);

  const toggleSort = (key: string, sortFn?: (r: T) => number | string) => {
    if (!sortFn) return;
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const alignCls = { left: "text-left", right: "text-right", center: "text-center" };
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {cols.map((c) => (
                <th key={c.key} className={cn("px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500", alignCls[c.align || "left"])}>
                  {c.sort ? (
                    <button type="button" onClick={() => toggleSort(c.key, c.sort)}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      {c.label}
                      {sortKey === c.key ? (sortDir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(r) : undefined}
                className={cn(
                  "border-b border-slate-100 transition-colors dark:border-slate-800",
                  onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60",
                  rowClass?.(r),
                )}
              >
                {cols.filter((c) => !c.hide?.(r)).map((c) => (
                  <td key={c.key} className={cn("px-3 py-2.5 align-middle", alignCls[c.align || "left"], c.className)}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      {!slice.length && <Empty message={empty || "No records found."} />}
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Page {cur} of {pages} · {sorted.length} records</span>
          <div className="flex gap-1">
            <IconBtn icon={<ChevronLeft className="size-4" />} label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))} />
            <IconBtn icon={<ChevronRight className="size-4" />} label="Next page" onClick={() => setPage((p) => Math.min(pages, p + 1))} />
          </div>
        </div>
      )}
    </div>
  );
}
