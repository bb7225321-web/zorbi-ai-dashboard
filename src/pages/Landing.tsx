import { Button } from "@/components/ui/button";
import { Zorbi } from "@/components/Zorbi";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  FolderOpen,
  GraduationCap,
  ListChecks,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const FEATURES = [
  {
    icon: MessageCircle,
    title: "AI Tutor, 24/7",
    desc: "Ask Zorbi anything — get clear, step-by-step explanations tailored to your courses, any time of day.",
    tile: "from-brand-400 to-brand-500",
    chip: "bg-brand-50 text-brand-600",
  },
  {
    icon: TrendingUp,
    title: "Progress that sticks",
    desc: "Visual mastery per subject, streaks that keep you motivated, and a weekly activity view of your momentum.",
    tile: "from-lavender-400 to-lavender-500",
    chip: "bg-lavender-100 text-lavender-600",
  },
  {
    icon: FolderOpen,
    title: "Materials & quizzes",
    desc: "Upload notes and slides once — Zorbi organizes them, and turns them into quizzes when you're ready.",
    tile: "from-mint-400 to-mint-500",
    chip: "bg-mint-100 text-mint-600",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your materials",
    desc: "Notes, slides, past papers — drop them in and Zorbi builds a study space around them.",
  },
  {
    n: "02",
    title: "Ask, practice, repeat",
    desc: "Chat with your AI tutor, drill quizzes, and get instant feedback on every answer.",
  },
  {
    n: "03",
    title: "Watch your progress grow",
    desc: "Follow your mastery per subject and keep your streak alive — day after day.",
  },
];

const REVIEWS = [
  {
    quote:
      "Zorbi feels like a tutor who actually knows my syllabus. I went from 68% to 91% in math in one term.",
    name: "Ayesha K.",
    role: "High school student",
  },
  {
    quote:
      "The streak system got me studying daily. My chemistry quiz scores have never been better.",
    name: "Daniel R.",
    role: "University freshman",
  },
  {
    quote:
      "Cleanest study app I've used. Uploading slides and asking questions takes seconds.",
    name: "Mariam S.",
    role: "IB Diploma student",
  },
];

function Nav() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4">
      <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5"
          aria-label="Zorbi AI home"
        >
          <Zorbi size={36} compact floating className="drop-shadow-[0_6px_12px_rgba(90,110,255,0.35)]" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Zorbi <span className="text-aurora">AI</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["Features", "#features"],
            ["How it works", "#how-it-works"],
            ["Reviews", "#reviews"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-800"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="cursor-pointer rounded-full text-slate-600 hover:bg-white/70 hover:text-slate-900"
            onClick={() => navigate("/auth")}
          >
            Sign in
          </Button>
          <Button
            className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white shadow-[0_10px_24px_-10px_rgba(90,110,255,0.7)] hover:from-brand-400 hover:to-lavender-400"
            onClick={() => navigate("/auth")}
          >
            Get started
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 lg:grid-cols-2 lg:pt-20">
      {/* soft page glows */}
      <div className="pointer-events-none absolute -left-32 top-10 size-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-lavender-200/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative"
      >
        <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-brand-600">
          <Sparkles className="size-3.5" />
          Your AI study buddy is here
        </span>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
          Learn anything,
          <br />
          <span className="text-aurora">with your AI buddy</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg">
          Zorbi AI turns your notes, slides, and questions into clear
          explanations, smart quizzes, and progress you can actually see — so
          studying finally feels easy.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 px-7 font-semibold text-white shadow-[0_16px_32px_-12px_rgba(90,110,255,0.7)] transition-transform hover:scale-[1.02] hover:from-brand-400 hover:to-lavender-400"
            onClick={() => navigate("/auth")}
          >
            Start learning free
            <ArrowRight className="size-4" />
          </Button>
          <a
            href="#features"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
          >
            See how it works
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex -space-x-2.5">
            {["A", "D", "M", "S"].map((c, i) => (
              <span
                key={c}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white",
                  ["bg-brand-400", "bg-lavender-400", "bg-mint-400", "bg-sun-400"][i],
                )}
              >
                {c}
              </span>
            ))}
          </div>
          <div>
            <span className="flex items-center gap-0.5 text-sun-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-current" />
              ))}
              <span className="ml-1.5 text-xs font-bold text-slate-700">4.9</span>
            </span>
            <p className="text-xs font-medium text-slate-400">
              Loved by 10,000+ students
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mascot visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex items-center justify-center py-6"
      >
        <div className="relative flex size-[340px] items-center justify-center sm:size-[400px]">
          <div className="absolute inset-6 rounded-full bg-white/40 blur-3xl" />
          <div className="animate-ring-spin absolute inset-2 rounded-full border border-dashed border-brand-300/60" />
          <div className="animate-ring-spin-reverse absolute inset-14 rounded-full border border-lavender-300/50" />
          <div className="absolute inset-20 rounded-full bg-gradient-to-br from-brand-100/70 to-lavender-100/70 blur-xl" />
          <Zorbi size={260} className="relative z-10 drop-shadow-[0_30px_50px_rgba(90,110,255,0.4)]" />

          {/* floating chips */}
          <div className="glass-chip animate-zorbi-float-soft absolute left-0 top-8 rounded-2xl px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="size-1.5 rounded-full bg-mint-400" />
              AI Tutor online
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              Replying instantly
            </p>
          </div>
          <div
            className="glass-chip animate-zorbi-float-soft absolute right-0 top-20 rounded-2xl px-3.5 py-2.5"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              🔥 7-day streak
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              Keep it up!
            </p>
          </div>
          <div
            className="glass-chip animate-zorbi-float-soft absolute bottom-8 left-6 rounded-2xl px-3.5 py-2.5"
            style={{ animationDelay: "0.6s" }}
          >
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ListChecks className="size-3.5 text-mint-500" />
              Quiz score
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              92% average this week
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: "10k+", label: "Active students" },
    { value: "50k+", label: "Materials mastered" },
    { value: "92%", label: "Average quiz score" },
    { value: "24/7", label: "AI tutor availability" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4">
      <motion.div {...fadeUp} className="glass grid grid-cols-2 gap-6 rounded-3xl px-6 py-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-extrabold tracking-tight text-aurora sm:text-3xl">
              {s.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">
              {s.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
          Features
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Everything you need to <span className="text-aurora">study smarter</span>
        </h2>
        <p className="mt-4 text-base text-slate-500">
          One calm, focused space for asking questions, tracking progress, and
          turning materials into mastery.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.1 }}
            className="glass group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-28px_rgba(70,95,200,0.4)]"
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_12px_24px_-10px_rgba(60,85,190,0.5)] transition-transform duration-300 group-hover:scale-105",
                f.tile,
              )}
            >
              <f.icon className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {f.desc}
            </p>
            <span className={cn("mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", f.chip)}>
              <Check className="size-3" />
              Included in Student plan
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-20">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lavender-500">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          From confusion to confidence in <span className="text-aurora">three steps</span>
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.1 }}
            className="glass relative overflow-hidden rounded-3xl p-6"
          >
            <span className="absolute -right-3 -top-6 text-[88px] font-extrabold leading-none text-brand-50">
              {s.n}
            </span>
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-lavender-500 text-sm font-bold text-white shadow-[0_10px_20px_-8px_rgba(90,110,255,0.6)]">
              {i + 1}
            </span>
            <h3 className="relative mt-5 text-lg font-bold tracking-tight text-slate-900">
              {s.title}
            </h3>
            <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
              {s.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section id="reviews" className="mx-auto max-w-6xl px-4 pb-20">
      <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-mint-500">
          Reviews
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Students love <span className="text-aurora">learning with Zorbi</span>
        </h2>
      </motion.div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <motion.figure
            key={r.name}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.1 }}
            className="glass rounded-3xl p-6"
          >
            <div className="flex gap-0.5 text-sun-500">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="size-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 text-sm leading-relaxed text-slate-600">
              "{r.quote}"
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-lavender-400 text-xs font-bold text-white">
                {r.name.charAt(0)}
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-800">
                  {r.name}
                </span>
                <span className="block text-xs font-medium text-slate-400">
                  {r.role}
                </span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 via-brand-400 to-lavender-500 p-[1px] shadow-[0_32px_70px_-30px_rgba(70,95,200,0.6)]"
      >
        <div className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -left-20 -top-28 size-80 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-16 size-80 rounded-full bg-lavender-200/40 blur-3xl" />
          <Zorbi
            size={120}
            className="mx-auto drop-shadow-[0_20px_36px_rgba(30,50,140,0.45)]"
          />
          <h2 className="mx-auto mt-6 max-w-xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to make studying feel effortless?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            Join thousands of students who learn faster with Zorbi AI. Free to
            start — no credit card required.
          </p>
          <Button
            size="lg"
            className="mt-8 cursor-pointer rounded-full bg-white px-8 font-bold text-brand-600 shadow-[0_16px_32px_-12px_rgba(20,40,120,0.5)] transition-transform hover:scale-[1.03] hover:bg-white"
            onClick={() => navigate("/auth")}
          >
            <GraduationCap className="size-5" />
            Start learning free
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-4 text-xs font-medium text-white/70">
            Free forever plan · Upgrade anytime
          </p>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/70 bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Zorbi size={30} compact floating className="drop-shadow-[0_5px_10px_rgba(90,110,255,0.3)]" />
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Zorbi <span className="text-aurora">AI</span>
          </span>
        </div>
        <p className="text-xs font-medium text-slate-400">
          © 2026 Zorbi AI. Made with 💙 for students everywhere.
        </p>
        <div className="flex items-center gap-5 text-xs font-semibold text-slate-500">
          <a href="#features" className="transition-colors hover:text-slate-800">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-slate-800">How it works</a>
          <a href="#reviews" className="transition-colors hover:text-slate-800">Reviews</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="shell-bg min-h-screen">
      <Nav />
      <main>
        <Hero />
        <StatsStrip />
        <Features />
        <HowItWorks />
        <Reviews />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
