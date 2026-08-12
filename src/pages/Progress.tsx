import { AppShell } from "@/components/AppShell";
import { RingProgress } from "@/components/RingProgress";
import { Zorbi } from "@/components/Zorbi";
import { cn } from "@/lib/utils";
import {
  Award,
  BookOpen,
  Clock,
  Flame,
  FlaskConical,
  Presentation,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const WEEK = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 30 },
  { day: "Wed", minutes: 65 },
  { day: "Thu", minutes: 40 },
  { day: "Fri", minutes: 55 },
  { day: "Sat", minutes: 80 },
  { day: "Sun", minutes: 60 },
];

const SUBJECTS = [
  {
    name: "Mathematics",
    icon: BookOpen,
    value: 80,
    bar: "from-brand-400 to-brand-500",
    tile: "bg-brand-50 text-brand-500",
    meta: "6 sessions · 4 quizzes",
  },
  {
    name: "Physics",
    icon: Presentation,
    value: 70,
    bar: "from-sun-400 to-coral-400",
    tile: "bg-sun-100 text-sun-500",
    meta: "5 sessions · 3 quizzes",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    value: 65,
    bar: "from-mint-400 to-mint-500",
    tile: "bg-mint-100 text-mint-500",
    meta: "4 sessions · 2 quizzes",
  },
  {
    name: "English",
    icon: Award,
    value: 90,
    bar: "from-lavender-400 to-lavender-500",
    tile: "bg-lavender-100 text-lavender-500",
    meta: "5 sessions · 6 quizzes",
  },
];

const ACHIEVEMENTS = [
  {
    icon: Flame,
    title: "7-Day Streak",
    desc: "Studied every day this week",
    tint: "bg-sun-100 text-sun-500",
  },
  {
    icon: Star,
    title: "Quiz Perfectionist",
    desc: "Scored 100% on a chemistry quiz",
    tint: "bg-lavender-100 text-lavender-500",
  },
  {
    icon: TrendingUp,
    title: "Fast Learner",
    desc: "Mastered 3 topics in one day",
    tint: "bg-mint-100 text-mint-500",
  },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-chip rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="mt-0.5 font-bold text-brand-600">
        {payload[0].value} min studied
      </p>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  tint,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass rounded-3xl p-6", className)}>
      <header className="flex items-center gap-2.5">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", tint)}>
          <Icon className="size-4" />
        </span>
        <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
          {title}
        </h2>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function Progress() {
  const totalMinutes = WEEK.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <AppShell
      title="Learning Progress"
      subtitle="Track your mastery, streaks, and weekly momentum."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Top row */}
        <div className="grid gap-5 xl:grid-cols-3">
          <Card title="Overall Progress" icon={Target} tint="bg-brand-50 text-brand-500">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
              <RingProgress value={75} label="Overall Progress" />
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-brand-500" />
                  <span className="text-slate-600">
                    <strong className="text-slate-900">{totalMinutes} min</strong>{" "}
                    this week
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-4 text-lavender-500" />
                  <span className="text-slate-600">
                    <strong className="text-slate-900">32</strong> concepts mastered
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Star className="size-4 text-sun-500" />
                  <span className="text-slate-600">
                    <strong className="text-slate-900">15</strong> quizzes attempted
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Weekly Activity"
            icon={TrendingUp}
            tint="bg-lavender-100 text-lavender-500"
            className="xl:col-span-2"
          >
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEK} barCategoryGap="28%">
                  <defs>
                    <linearGradient id="weekly-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6E8CFF" />
                      <stop offset="100%" stopColor="#8B7CFF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(140,160,220,0.16)"
                    strokeDasharray="4 6"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis
                    hide
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(110,140,255,0.08)", radius: 10 }}
                    content={<ChartTooltip />}
                  />
                  <Bar
                    dataKey="minutes"
                    fill="url(#weekly-grad)"
                    radius={[10, 10, 10, 10]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Streak + points row */}
        <div className="grid gap-5 md:grid-cols-3">
          <section className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-sun-200/60 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sun-300 to-coral-400 text-white shadow-[0_12px_24px_-10px_rgba(240,150,60,0.8)]">
                <Flame className="size-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Study Streak
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  7 days
                </p>
              </div>
            </div>
            <p className="relative mt-4 text-sm font-medium text-slate-500">
              Keep it up! 🔥 Best streak: 12 days
            </p>
            <div className="relative mt-3 flex items-center gap-1.5">
              {[35, 45, 40, 60, 52, 75, 68, 88].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-full bg-gradient-to-t from-sun-300 to-coral-300"
                  style={{ height: `${h * 0.5}px` }}
                />
              ))}
            </div>
          </section>

          <section className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-lavender-200/60 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-500 text-white shadow-[0_12px_24px_-10px_rgba(150,110,255,0.8)]">
                <Star className="size-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Zorbi Points
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  1,250
                </p>
              </div>
            </div>
            <p className="relative mt-4 text-sm font-medium text-slate-500">
              Level 4 · Curious Learner
            </p>
            <div className="relative mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-lavender-400 to-lavender-500" />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                180 points to Level 5 · Knowledge Seeker
              </p>
            </div>
          </section>

          <section className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-mint-200/60 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-[0_12px_24px_-10px_rgba(80,200,160,0.8)]">
                <Target className="size-6" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Daily Goal
                </p>
                <p className="text-2xl font-extrabold tracking-tight text-slate-900">
                  60 / 90 min
                </p>
              </div>
            </div>
            <p className="relative mt-4 text-sm font-medium text-slate-500">
              Just 30 minutes to reach today's goal!
            </p>
            <div className="relative mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                <div className="h-full w-[67%] rounded-full bg-gradient-to-r from-mint-400 to-mint-500" />
              </div>
              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                Sunday · 60 of 90 minutes
              </p>
            </div>
          </section>
        </div>

        {/* Subject mastery */}
        <section className="glass rounded-3xl p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              Subject Mastery
            </h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
              Term 2 · 2026
            </span>
          </header>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SUBJECTS.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl border border-white/70 bg-white/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_28px_-14px_rgba(52,80,160,0.35)]"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", s.tile)}>
                    <s.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {s.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {s.meta}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", s.bar)}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">
                    {s.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Achievements */}
        <section className="glass rounded-3xl p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
              Recent Achievements
            </h2>
            <Zorbi size={44} compact floating className="drop-shadow-[0_10px_18px_rgba(90,110,255,0.3)]" />
          </header>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3.5 rounded-2xl border border-white/70 bg-white/60 p-4"
              >
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", a.tint)}>
                  <a.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
