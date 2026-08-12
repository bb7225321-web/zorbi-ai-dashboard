import { AppShell } from "@/components/AppShell";
import { RingProgress } from "@/components/RingProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Zorbi } from "@/components/Zorbi";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  Clock,
  FileText,
  Flame,
  FlaskConical,
  FolderOpen,
  ListChecks,
  Presentation,
  Send,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function SectionCard({
  className,
  children,
  title,
  action,
}: {
  className?: string;
  children: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("glass rounded-3xl p-6", className)}>
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {action}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { left: "18%", top: "30%", size: 5, delay: "0s", color: "#8FB2FF" },
  { left: "26%", top: "62%", size: 4, delay: "1.4s", color: "#B9AFFF" },
  { left: "34%", top: "18%", size: 3, delay: "2.6s", color: "#7C9CFF" },
  { left: "62%", top: "22%", size: 4, delay: "0.8s", color: "#C4B5FD" },
  { left: "72%", top: "58%", size: 5, delay: "2s", color: "#8FB2FF" },
  { left: "80%", top: "26%", size: 3, delay: "3.2s", color: "#A5C8FF" },
  { left: "55%", top: "70%", size: 3, delay: "1s", color: "#C4B5FD" },
  { left: "44%", top: "26%", size: 4, delay: "3.8s", color: "#9DB8FF" },
];

function HeroCard() {
  return (
    <section className="relative overflow-hidden rounded-3xl p-6 shadow-[0_24px_60px_-28px_rgba(70,95,200,0.45)] lg:p-8">
      {/* Aurora backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(214,228,255,0.95) 0%, rgba(236,230,255,0.92) 42%, rgba(224,240,255,0.9) 78%, rgba(228,244,236,0.9) 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-32 size-96 rounded-full bg-brand-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 size-[420px] rounded-full bg-lavender-300/40 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[560px] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-particle absolute rounded-full blur-[1px]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            boxShadow: `0 0 10px 2px ${p.color}66`,
          }}
        />
      ))}

      <div className="relative grid items-center gap-6 lg:grid-cols-[250px_1fr_250px]">
        {/* Left mini card */}
        <div className="glass-chip animate-zorbi-float-soft order-2 rounded-2xl p-4 lg:order-1 lg:self-start">
          <div className="flex items-center gap-2">
            <span className="text-lg">👋</span>
            <p className="text-sm font-bold text-slate-800">I'm Zorbi!</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Your AI study buddy. Ask me anything, I'm here to help!
          </p>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-mint-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-mint-500">
              Online · Ready to help
            </span>
          </div>
        </div>

        {/* Center mascot */}
        <div className="order-1 flex flex-col items-center lg:order-2">
          <div className="relative flex h-[280px] w-[280px] items-center justify-center">
            {/* Orbit rings */}
            <div className="animate-ring-spin absolute inset-4 rounded-full border border-dashed border-brand-300/50" />
            <div className="animate-ring-spin-reverse absolute inset-10 rounded-full border border-lavender-300/40" />
            <div className="absolute inset-0 rounded-full bg-white/30 blur-2xl" />
            <Zorbi size={210} className="relative z-10 drop-shadow-[0_24px_40px_rgba(90,110,255,0.35)]" />
          </div>
          <p className="mt-1 text-center text-xs font-semibold text-slate-500">
            Zorbi is learning with you today ✨
          </p>
        </div>

        {/* Right mini card */}
        <div className="glass-chip order-3 rounded-2xl p-4 lg:self-start">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sun-300 to-coral-400 text-white shadow-[0_8px_16px_-8px_rgba(240,150,60,0.8)]">
              <Flame className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Study Streak
              </p>
              <p className="text-xl font-extrabold tracking-tight text-slate-900">
                7 Days
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            Keep it up! 🔥
          </p>
          {/* Upward progress line */}
          <svg viewBox="0 0 120 36" className="mt-2 h-9 w-full">
            <defs>
              <linearGradient id="streak-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FBBF6B" />
                <stop offset="100%" stopColor="#F4725C" />
              </linearGradient>
            </defs>
            <polyline
              points="2,30 18,24 34,27 50,18 66,22 84,10 100,14 118,4"
              fill="none"
              stroke="url(#streak-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="118" cy="4" r="3" fill="#F4725C" />
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stats row                                                          */
/* ------------------------------------------------------------------ */

const STATS = [
  {
    label: "Materials",
    value: "24",
    hint: "Uploaded by you",
    icon: FolderOpen,
    tile: "from-brand-400 to-brand-500",
    tint: "bg-brand-50 text-brand-600",
  },
  {
    label: "Assignments",
    value: "8",
    hint: "Pending tasks",
    icon: ClipboardList,
    tile: "from-sun-400 to-coral-400",
    tint: "bg-sun-100 text-sun-500",
  },
  {
    label: "Quizzes",
    value: "15",
    hint: "Attempted",
    icon: ListChecks,
    tile: "from-mint-400 to-mint-500",
    tint: "bg-mint-100 text-mint-500",
  },
  {
    label: "Points",
    value: "1,250",
    hint: "Zorbi Points",
    icon: Star,
    tile: "from-lavender-400 to-lavender-500",
    tint: "bg-lavender-100 text-lavender-500",
  },
] as const;

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="glass group rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
                stat.tint,
              )}
            >
              <stat.icon className="size-5" />
            </span>
            <ArrowUpRight className="size-4 text-slate-300 transition-colors group-hover:text-brand-400" />
          </div>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            {stat.value}
          </p>
          <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
          <p className="mt-0.5 text-xs text-slate-400">{stat.hint}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent materials                                                   */
/* ------------------------------------------------------------------ */

const MATERIALS = [
  {
    name: "Calculus Notes.pdf",
    meta: "2.4 MB · Today",
    subject: "Mathematics",
    icon: FileText,
    tile: "bg-coral-100 text-coral-500",
    tag: "bg-coral-100 text-coral-600",
  },
  {
    name: "Physics Chapter 5.pptx",
    meta: "5.7 MB · Yesterday",
    subject: "Physics",
    icon: Presentation,
    tile: "bg-sun-100 text-sun-500",
    tag: "bg-sun-100 text-sun-600",
  },
  {
    name: "Chemistry Formula Sheet.pdf",
    meta: "1.8 MB · 2 days ago",
    subject: "Chemistry",
    icon: FlaskConical,
    tile: "bg-mint-100 text-mint-500",
    tag: "bg-mint-100 text-mint-600",
  },
  {
    name: "English Essay Guide.docx",
    meta: "3.2 MB · 3 days ago",
    subject: "English",
    icon: BookOpen,
    tile: "bg-brand-100 text-brand-500",
    tag: "bg-brand-100 text-brand-600",
  },
];

function MaterialsCard() {
  return (
    <SectionCard
      title="Recent Materials"
      action={
        <Button variant="ghost" size="sm" className="cursor-pointer rounded-full text-brand-600 hover:bg-brand-50 hover:text-brand-700">
          View all
          <ArrowUpRight className="size-3.5" />
        </Button>
      }
    >
      <ul className="flex flex-col gap-2">
        {MATERIALS.map((m) => (
          <li
            key={m.name}
            className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/70 bg-white/60 px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_28px_-14px_rgba(52,80,160,0.35)]"
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                m.tile,
              )}
            >
              <m.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {m.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">{m.meta}</p>
            </div>
            <Badge
              variant="secondary"
              className={cn("rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold", m.tag)}
            >
              {m.subject}
            </Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Today's plan                                                       */
/* ------------------------------------------------------------------ */

const PLAN = [
  { task: "Complete Calculus Assignment", time: "10:00 AM", status: "done", dot: "bg-mint-400" },
  { task: "Study Physics – Chapter 6", time: "01:00 PM", status: "next", dot: "bg-brand-400" },
  { task: "Attempt Quiz – Chemistry", time: "04:00 PM", status: "todo", dot: "bg-sun-400" },
  { task: "Revise English Essay", time: "07:00 PM", status: "todo", dot: "bg-lavender-400" },
] as const;

function PlanCard() {
  const [checked, setChecked] = useState<boolean[]>([true, false, false, false]);

  return (
    <SectionCard
      title="Today's Plan"
      action={
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
          {checked.filter(Boolean).length} of {PLAN.length} done
        </span>
      }
    >
      <ul className="flex flex-col gap-2">
        {PLAN.map((task, i) => {
          const done = checked[i];
          return (
            <li
              key={task.task}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all",
                done
                  ? "border-mint-200/70 bg-mint-100/50"
                  : "border-white/70 bg-white/60 hover:bg-white/90",
              )}
            >
              <Checkbox
                checked={done}
                onCheckedChange={(v) => {
                  const next = [...checked];
                  next[i] = v === true;
                  setChecked(next);
                }}
                className={cn(
                  "size-5 rounded-lg border-slate-300 bg-white data-[state=checked]:border-mint-500 data-[state=checked]:bg-mint-500 data-[state=checked]:text-white",
                )}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-sm font-semibold transition-colors",
                    done ? "text-slate-400 line-through" : "text-slate-800",
                  )}
                >
                  {task.task}
                </p>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="size-3.5" />
                  {task.time}
                </span>
              </div>
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9)]",
                  task.dot,
                )}
              />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Progress                                                           */
/* ------------------------------------------------------------------ */

const SUBJECTS = [
  { name: "Mathematics", value: 80, bar: "from-brand-400 to-brand-500", chip: "bg-brand-50 text-brand-600" },
  { name: "Physics", value: 70, bar: "from-sun-400 to-coral-400", chip: "bg-sun-100 text-sun-600" },
  { name: "Chemistry", value: 65, bar: "from-mint-400 to-mint-500", chip: "bg-mint-100 text-mint-600" },
  { name: "English", value: 90, bar: "from-lavender-400 to-lavender-500", chip: "bg-lavender-100 text-lavender-600" },
];

function ProgressCard() {
  return (
    <SectionCard title="Your Progress">
      <div className="flex flex-col items-center gap-6">
        <RingProgress value={75} label="Overall Progress" />
        <div className="w-full space-y-4">
          {SUBJECTS.map((s) => (
            <div key={s.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{s.name}</span>
                <span
                  className={cn("rounded-full px-2 py-0.5 font-bold", s.chip)}
                >
                  {s.value}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                    s.bar,
                  )}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Ask Zorbi                                                          */
/* ------------------------------------------------------------------ */

const PROMPTS = [
  "Explain integrals simply",
  "Quiz me on physics",
  "Help with my essay",
  "Chemistry revision plan",
];

function AskZorbiCard() {
  const navigate = useNavigate();

  const ask = (q: string) => {
    navigate(q ? `/tutor?q=${encodeURIComponent(q)}` : "/tutor");
  };

  return (
    <section className="glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 lg:flex-row lg:items-center">
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-lavender-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-brand-200/50 blur-3xl" />

      <div className="relative flex items-center gap-5 lg:w-72 lg:flex-col lg:items-start">
        <Zorbi
          size={92}
          floating
          className="shrink-0 drop-shadow-[0_16px_28px_rgba(90,110,255,0.35)]"
        />
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
            What do you want to learn today?
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Zorbi turns questions into understanding.
          </p>
        </div>
      </div>

      <div className="relative mt-6 lg:mt-0 lg:flex-1 lg:pl-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            ask(String(data.get("question") ?? "").trim());
          }}
          className="glass-input flex items-center gap-3 rounded-2xl p-2 pl-4"
        >
          <input
            name="question"
            type="text"
            placeholder="Type your question..."
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-brand-500 to-lavender-500 text-white shadow-[0_10px_22px_-8px_rgba(90,110,255,0.7)] transition-transform hover:scale-105 hover:from-brand-400 hover:to-lavender-400"
            aria-label="Ask Zorbi"
          >
            <Send className="size-4" />
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => ask(p)}
              className="glass-chip cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:text-brand-600"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        navigate("/tutor");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const name = user?.name || "Fahad";

  return (
    <AppShell
      title={`Hello, ${name}! 👋`}
      subtitle="Ready to learn something amazing today?"
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <HeroCard />
        <StatsRow />
        <div className="grid gap-5 lg:grid-cols-2">
          <MaterialsCard />
          <PlanCard />
        </div>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <ProgressCard />
          </div>
          <div className="xl:col-span-3">
            <AskZorbiCard />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
