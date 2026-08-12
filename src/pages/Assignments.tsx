import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useLocalState } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";
import { SUBJECTS, SubjectBadge, SubjectDot } from "@/lib/subjects";
import {
  CalendarDays,
  Check,
  ClipboardList,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Subject } from "@/lib/subjects";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Priority = "High" | "Medium" | "Low";

interface Assignment {
  id: string;
  title: string;
  subject: Subject;
  due: string;
  dueLabel: string;
  priority: Priority;
  progress: number;
  completed: boolean;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  High: "bg-coral-100 text-coral-600",
  Medium: "bg-sun-100 text-sun-600",
  Low: "bg-mint-100 text-mint-600",
};

const SEED: Assignment[] = [
  { id: "a1", title: "Calculus Assignment — Derivatives", subject: "Mathematics", due: "Mon, Aug 18", dueLabel: "2 days left", priority: "High", progress: 60, completed: false },
  { id: "a2", title: "Physics Problem Set — Chapter 6", subject: "Physics", due: "Wed, Aug 20", dueLabel: "4 days left", priority: "Medium", progress: 30, completed: false },
  { id: "a3", title: "Chemistry Lab Report", subject: "Chemistry", due: "Fri, Aug 22", dueLabel: "6 days left", priority: "Medium", progress: 10, completed: false },
  { id: "a4", title: "English Essay — First Draft", subject: "English", due: "Sun, Aug 24", dueLabel: "8 days left", priority: "Low", progress: 0, completed: false },
  { id: "a5", title: "Algebra Worksheet 4", subject: "Mathematics", due: "Aug 8", dueLabel: "Completed", priority: "High", progress: 100, completed: true },
  { id: "a6", title: "Physics Quiz Review", subject: "Physics", due: "Aug 5", dueLabel: "Completed", priority: "Medium", progress: 100, completed: true },
  { id: "a7", title: "Chemistry Formula Drills", subject: "Chemistry", due: "Aug 2", dueLabel: "Completed", priority: "Low", progress: 100, completed: true },
];

export default function Assignments() {
  const [assignments, setAssignments] = useLocalState<Assignment[]>(
    "zorbi-assignments",
    SEED,
  );
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const navigate = useNavigate();

  const upcoming = assignments.filter((a) => !a.completed);
  const completed = assignments.filter((a) => a.completed);
  const shown = tab === "upcoming" ? upcoming : completed;

  const toggle = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed, progress: a.completed ? a.progress : 100 } : a)),
    );
    const item = assignments.find((a) => a.id === id);
    if (item && !item.completed) {
      toast(`Nice work! "${item.title}" marked complete.`);
    }
  };

  return (
    <AppShell
      title="Assignments"
      subtitle="Stay on top of due dates with priority and AI help."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { icon: ClipboardList, label: "Upcoming", value: String(upcoming.length), tint: "bg-brand-50 text-brand-500" },
            { icon: Check, label: "Completed", value: String(completed.length), tint: "bg-mint-100 text-mint-500" },
            { icon: Flame, label: "On-time rate", value: "92%", tint: "bg-sun-100 text-sun-500" },
            { icon: TrendingUp, label: "Avg. progress", value: `${Math.round(upcoming.reduce((s, a) => s + a.progress, 0) / Math.max(upcoming.length, 1))}%`, tint: "bg-lavender-100 text-lavender-500" },
          ].map((s) => (
            <div key={s.label} className="glass flex items-center gap-3.5 rounded-2xl p-4">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", s.tint)}>
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-slate-900">{s.value}</p>
                <p className="text-xs font-medium text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <GlassCard
          title={`${tab === "upcoming" ? "Upcoming" : "Completed"} assignments (${shown.length})`}
          action={
            <div className="flex rounded-full border border-white/80 bg-white/70 p-1 shadow-sm">
              {(["upcoming", "completed"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    "cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                    tab === t
                      ? "bg-gradient-to-r from-brand-500 to-lavender-500 text-white shadow-[0_6px_14px_-6px_rgba(90,110,255,0.6)]"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        >
          <ul className="flex flex-col gap-3">
            {shown.map((a) => {
              const style = SUBJECTS[a.subject];
              return (
                <li
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all lg:flex-row lg:items-center",
                    a.completed
                      ? "border-mint-200/60 bg-mint-100/40"
                      : "border-white/70 bg-white/60 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_14px_30px_-16px_rgba(52,80,160,0.4)]",
                  )}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => toggle(a.id)}
                    aria-label={a.completed ? "Mark as not done" : "Mark as done"}
                    className={cn(
                      "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
                      a.completed
                        ? "border-mint-500 bg-mint-500 text-white shadow-[0_4px_10px_-4px_rgba(80,200,160,0.7)]"
                        : "border-slate-300 bg-white hover:border-brand-400",
                    )}
                  >
                    {a.completed && <Check className="size-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold", a.completed ? "text-slate-400 line-through" : "text-slate-800")}>
                      {a.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <SubjectDot subject={a.subject} />
                        {a.subject}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        Due {a.due}
                        <span className="font-medium text-slate-500">· {a.dueLabel}</span>
                      </span>
                    </div>
                    {/* progress */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r", style.bar)}
                          style={{ width: `${a.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{a.progress}%</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", PRIORITY_STYLES[a.priority])}>
                      {a.priority}
                    </span>
                    <SubjectBadge subject={a.subject} />
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer rounded-full bg-brand-50 font-semibold text-brand-600 hover:bg-brand-100 hover:text-brand-700"
                      onClick={() => navigate(`/tutor?q=${encodeURIComponent(`Help me with the assignment "${a.title}"`)}`)}
                    >
                      <Sparkles className="size-3.5" />
                      AI help
                    </Button>
                  </div>
                </li>
              );
            })}
            {shown.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-mint-100 text-mint-500">
                  <Check className="size-7" />
                </span>
                <p className="text-sm font-semibold text-slate-600">
                  {tab === "upcoming" ? "Nothing due right now 🎉" : "No completed assignments yet"}
                </p>
                <p className="text-xs text-slate-400">You're all caught up.</p>
              </div>
            )}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
