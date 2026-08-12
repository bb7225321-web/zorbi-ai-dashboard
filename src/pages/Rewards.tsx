import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { useLocalState } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";
import { Zorbi } from "@/components/Zorbi";
import {
  Award,
  BookOpenCheck,
  Brain,
  Check,
  Crown,
  Flame,
  Gift,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const BADGES = [
  { icon: Flame, name: "7-Day Streak", desc: "Study 7 days in a row", unlocked: true },
  { icon: Star, name: "Quiz Perfectionist", desc: "Score 100% on any quiz", unlocked: true },
  { icon: BookOpenCheck, name: "Bookworm", desc: "Upload 10 materials", unlocked: true },
  { icon: Target, name: "First Blood", desc: "Complete your first assignment", unlocked: true },
  { icon: Brain, name: "Deep Thinker", desc: "Ask Zorbi 25 questions", unlocked: false },
  { icon: Trophy, name: "Top of the Class", desc: "Reach 90% in one subject", unlocked: false },
  { icon: Medal, name: "Marathoner", desc: "Maintain a 30-day streak", unlocked: false },
  { icon: Zap, name: "Speedster", desc: "Finish a quiz in under 3 minutes", unlocked: false },
  { icon: Sparkles, name: "Rising Star", desc: "Earn 2,500 Zorbi Points", unlocked: false },
  { icon: Crown, name: "Royal Scholar", desc: "Reach Level 10", unlocked: false },
  { icon: Award, name: "Perfect Week", desc: "Complete every daily goal for 7 days", unlocked: false },
  { icon: Gift, name: "Generous Mind", desc: "Share 5 materials with a group", unlocked: false },
];

const STREAK_REWARDS = [
  { days: 3, reward: "50 Zorbi Points", icon: Star, claimed: false },
  { days: 7, reward: "Boost Badge · +1 day protection", icon: Shield, claimed: true },
  { days: 14, reward: "150 Zorbi Points", icon: Star, claimed: false },
  { days: 30, reward: "Exclusive 'Marathoner' badge", icon: Trophy, claimed: false },
];

function Shield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const LEVELS = [
  { level: 1, name: "Curious Learner", min: 0 },
  { level: 2, name: "Knowledge Seeker", min: 300 },
  { level: 3, name: "Active Thinker", min: 700 },
  { level: 4, name: "Rising Scholar", min: 1200 },
  { level: 5, name: "Smart Starter", min: 1800 },
  { level: 6, name: "Focused Mind", min: 2500 },
  { level: 7, name: "Expert in Training", min: 3300 },
  { level: 8, name: "Master Student", min: 4200 },
  { level: 9, name: "Genius Lab", min: 5200 },
  { level: 10, name: "Royal Scholar", min: 6500 },
];

export default function Rewards() {
  const [points, setPoints] = useLocalState<number>("zorbi-points", 1250);
  const [claimed, setClaimed] = useLocalState<string[]>("zorbi-claimed-rewards", []);

  const levelIndex = LEVELS.reduce((acc, l, i) => (points >= l.min ? i : acc), 0);
  const current = LEVELS[levelIndex];
  const next = LEVELS[levelIndex + 1];
  const levelProgress = next
    ? Math.round(((points - current.min) / (next.min - current.min)) * 100)
    : 100;

  const claim = (days: number) => {
    if (claimed.includes(String(days))) return;
    const reward = STREAK_REWARDS.find((r) => r.days === days)!;
    const gained = reward.reward.startsWith("50")
      ? 50
      : reward.reward.startsWith("150")
        ? 150
        : 0;
    setClaimed((prev) => [...prev, String(days)]);
    if (gained > 0) setPoints((p) => p + gained);
    toast(`Reward claimed!`, {
      description: `${reward.reward} added to your account.`,
    });
  };

  return (
    <AppShell
      title="Rewards"
      subtitle="Earn Zorbi Points, unlock badges, and level up."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Points + level */}
        <div className="grid gap-5 lg:grid-cols-3">
          <section className="glass relative overflow-hidden rounded-3xl p-6 lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-lavender-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-brand-200/50 blur-3xl" />
            <div className="relative flex flex-col items-center gap-6 sm:flex-row">
              <div className="relative">
                <Zorbi size={120} className="drop-shadow-[0_20px_34px_rgba(90,110,255,0.35)]" />
                <span className="absolute -right-1 -top-1 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sun-300 to-coral-400 text-white shadow-[0_8px_18px_-6px_rgba(240,150,60,0.8)]">
                  <Star className="size-5 fill-current" />
                </span>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Zorbi Points balance
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900">
                  {points.toLocaleString()}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Level {current.level} · {current.name}
                </p>
                <div className="mt-3 w-full max-w-xs">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80 shadow-[inset_0_1px_2px_rgba(30,50,110,0.08)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lavender-400 to-brand-500 transition-all duration-700"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                    {next ? `${next.min - points} points to Level ${next.level} · ${next.name}` : "Max level reached! 🏆"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <GlassCard title="How to earn points">
            <ul className="space-y-3 text-sm">
              {[
                { label: "Complete a quiz", value: "+50 pts", icon: Star },
                { label: "Finish an assignment", value: "+30 pts", icon: Check },
                { label: "Daily study goal (60 min)", value: "+20 pts", icon: Target },
                { label: "Maintain your streak", value: "+10 pts / day", icon: Flame },
              ].map((r) => (
                <li key={r.label} className="flex items-center justify-between rounded-xl border border-white/70 bg-white/60 px-3.5 py-2.5">
                  <span className="flex items-center gap-2.5 font-medium text-slate-600">
                    <r.icon className="size-4 text-brand-400" />
                    {r.label}
                  </span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600">
                    {r.value}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* Badges */}
        <GlassCard
          title={`Achievement badges (${BADGES.filter((b) => b.unlocked).length}/${BADGES.length})`}
          action={
            <span className="text-xs font-medium text-slate-400">
              Keep studying to unlock the rest
            </span>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {BADGES.map((b) => (
              <div
                key={b.name}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                  b.unlocked
                    ? "border-white/80 bg-gradient-to-b from-brand-50/70 to-lavender-50/50 hover:-translate-y-0.5"
                    : "border-white/60 bg-white/40 opacity-60 grayscale",
                )}
              >
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl shadow-[0_10px_20px_-8px_rgba(90,110,255,0.5)]",
                    b.unlocked ? "bg-gradient-to-br from-brand-400 to-lavender-500 text-white" : "bg-slate-200 text-slate-400",
                  )}
                >
                  <b.icon className="size-6" />
                </span>
                <p className="text-xs font-bold leading-tight text-slate-800">{b.name}</p>
                <p className="text-[10px] font-medium leading-snug text-slate-400">{b.desc}</p>
                {b.unlocked && (
                  <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-mint-600">
                    Unlocked
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Streak rewards */}
        <GlassCard
          title="Streak rewards"
          action={
            <span className="flex items-center gap-1.5 rounded-full bg-sun-100 px-2.5 py-1 text-[11px] font-bold text-sun-600">
              <Flame className="size-3.5" />
              Current streak: 7 days
            </span>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STREAK_REWARDS.map((r) => {
              const isClaimed = claimed.includes(String(r.days));
              const reached = r.days <= 7;
              return (
                <div
                  key={r.days}
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    isClaimed
                      ? "border-mint-200/70 bg-mint-100/40"
                      : reached
                        ? "border-white/80 bg-white/60 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-16px_rgba(52,80,160,0.4)]"
                        : "border-white/60 bg-white/40 opacity-60",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        isClaimed ? "bg-mint-100 text-mint-500" : reached ? "bg-sun-100 text-sun-500" : "bg-slate-100 text-slate-400",
                      )}
                    >
                      <r.icon className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Day {r.days}</span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">{r.reward}</p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isClaimed || !reached}
                    onClick={() => claim(r.days)}
                    className={cn(
                      "mt-3 w-full cursor-pointer rounded-full font-semibold",
                      isClaimed
                        ? "bg-mint-100 text-mint-600 hover:bg-mint-100"
                        : reached
                          ? "bg-gradient-to-r from-sun-400 to-coral-400 text-white hover:from-sun-300 hover:to-coral-300"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {isClaimed ? (
                      <>
                        <Check className="size-3.5" />
                        Claimed
                      </>
                    ) : reached ? (
                      "Claim reward"
                    ) : (
                      `Reach day ${r.days}`
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
