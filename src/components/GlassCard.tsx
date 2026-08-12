import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  title,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || action);
  return (
    <section className={cn("glass rounded-3xl p-6", className)}>
      {hasHeader && (
        <header className="flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className={cn(hasHeader && "mt-5", bodyClassName)}>{children}</div>
    </section>
  );
}
