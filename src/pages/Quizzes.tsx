import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalState } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS, SUBJECTS, SubjectBadge } from "@/lib/subjects";
import { ArrowLeft, ArrowRight, Check, ListChecks, RotateCcw, Timer, X } from "lucide-react";
import type { Subject } from "@/lib/subjects";
import { useState } from "react";
import { toast } from "sonner";

interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
}

interface Quiz {
  id: string;
  title: string;
  subject: Subject;
  time: string;
  questions: QuizQuestion[];
}

const QUIZZES: Quiz[] = [
  {
    id: "q1",
    title: "Calculus Basics",
    subject: "Mathematics",
    time: "8 min",
    questions: [
      { q: "What is the derivative of x³?", options: ["3x²", "x²", "3x", "3x³"], answer: 0 },
      { q: "What does the derivative measure?", options: ["Area under a curve", "Rate of change", "Total distance", "Average value"], answer: 1 },
      { q: "If f(x) = 2x + 5, what is f'(x)?", options: ["2", "2x", "5", "2x + 5"], answer: 0 },
    ],
  },
  {
    id: "q2",
    title: "Motion & Forces",
    subject: "Physics",
    time: "6 min",
    questions: [
      { q: "Which equation relates velocity, acceleration and time?", options: ["v = u + at", "F = ma", "E = mc²", "s = vt"], answer: 0 },
      { q: "A 10 kg object accelerates at 2 m/s². What's the force?", options: ["5 N", "12 N", "20 N", "100 N"], answer: 2 },
      { q: "What unit is force measured in?", options: ["Joules", "Newtons", "Watts", "Pascals"], answer: 1 },
    ],
  },
  {
    id: "q3",
    title: "Moles & Stoichiometry",
    subject: "Chemistry",
    time: "7 min",
    questions: [
      { q: "How many moles are in 44 g of CO₂ (M = 44 g/mol)?", options: ["0.5", "1", "2", "44"], answer: 1 },
      { q: "Avogadro's number is approximately:", options: ["6.02 × 10²³", "3.14 × 10²", "9.81 × 10⁰", "1.6 × 10⁻¹⁹"], answer: 0 },
      { q: "In a balanced equation, atoms are:", options: ["Created", "Destroyed", "Conserved", "Ionized"], answer: 2 },
    ],
  },
  {
    id: "q4",
    title: "Essay Skills",
    subject: "English",
    time: "6 min",
    questions: [
      { q: "What should every body paragraph start with?", options: ["A quote", "A topic sentence", "The conclusion", "A rhetorical question"], answer: 1 },
      { q: "A thesis statement should be:", options: ["A question", "A clear, arguable claim", "A summary", "A greeting"], answer: 1 },
      { q: "Where does the thesis usually appear?", options: ["Last paragraph", "Title", "First paragraph", "Footnote"], answer: 2 },
    ],
  },
];

export default function Quizzes() {
  const [subject, setSubject] = useState<"All" | Subject>("All");
  const [tab, setTab] = useState<"available" | "completed">("available");
  const [attempts, setAttempts] = useLocalState<Record<string, number>>("zorbi-quiz-attempts", {});

  // Player state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const available = QUIZZES.filter((qz) => subject === "All" || qz.subject === subject);
  const completed = QUIZZES.filter((qz) => attempts[qz.id] !== undefined && (subject === "All" || qz.subject === subject));
  const shown = tab === "available" ? available : completed;

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrent(0);
    setAnswers([]);
    setFinished(false);
  };

  const select = (idx: number) => {
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
  };

  const next = () => {
    if (current < activeQuiz!.questions.length - 1) setCurrent((c) => c + 1);
  };

  const finish = () => {
    const score = activeQuiz!.questions.reduce(
      (sum, question, i) => sum + (answers[i] === question.answer ? 1 : 0),
      0,
    );
    const pct = Math.round((score / activeQuiz!.questions.length) * 100);
    setAttempts((prev) => ({ ...prev, [activeQuiz!.id]: Math.max(prev[activeQuiz!.id] ?? 0, pct) }));
    setFinished(true);
    if (pct >= 80) toast(`Quiz complete — ${pct}%! 🎉`);
    else toast(`Quiz complete — ${pct}%. Review and try again!`);
  };

  const restart = () => startQuiz(activeQuiz!);

  return (
    <AppShell
      title="Quizzes"
      subtitle="Turn your materials into quick, smart practice."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <GlassCard>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["All", ...SUBJECT_KEYS] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s as "All" | Subject)}
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    subject === s
                      ? "bg-gradient-to-r from-brand-500 to-lavender-500 text-white shadow-[0_6px_14px_-6px_rgba(90,110,255,0.6)]"
                      : "glass-chip text-slate-500 hover:text-brand-600",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex rounded-full border border-white/80 bg-white/70 p-1 shadow-sm">
              {(["available", "completed"] as const).map((t) => (
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
                  {t} ({t === "available" ? available.length : completed.length})
                </button>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {shown.map((qz) => {
            const style = SUBJECTS[qz.subject];
            const best = attempts[qz.id];
            return (
              <article
                key={qz.id}
                className="glass flex flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgba(70,95,200,0.45)]"
              >
                <div className="flex items-start justify-between">
                  <span className={cn("flex size-11 items-center justify-center rounded-xl", style.tile)}>
                    <style.icon className="size-5" />
                  </span>
                  {best !== undefined ? (
                    <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11px] font-bold text-mint-600">
                      Best {best}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                      <Timer className="size-3" />
                      {qz.time}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-slate-900">{qz.title}</h3>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {qz.questions.length} questions · {qz.time}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <SubjectBadge subject={qz.subject} />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => startQuiz(qz)}
                    className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white shadow-[0_8px_18px_-8px_rgba(90,110,255,0.7)] hover:from-brand-400 hover:to-lavender-400"
                  >
                    {best !== undefined ? "Retake" : "Start Quiz"}
                  </Button>
                </div>
              </article>
            );
          })}
          {shown.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-lavender-100 text-lavender-500">
                <ListChecks className="size-7" />
              </span>
              <p className="text-sm font-semibold text-slate-600">No quizzes here yet</p>
              <p className="text-xs text-slate-400">Try another subject filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz player */}
      <Dialog open={activeQuiz !== null} onOpenChange={(open) => !open && setActiveQuiz(null)}>
        <DialogContent className="max-w-xl rounded-3xl border-white/80 bg-white/95 p-0 shadow-[0_32px_70px_-30px_rgba(70,95,200,0.5)] backdrop-blur-2xl">
          {activeQuiz && (
            <div className="p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold tracking-tight text-slate-900">
                    {finished ? "Results" : activeQuiz.title}
                  </span>
                  <SubjectBadge subject={activeQuiz.subject} />
                </DialogTitle>
              </DialogHeader>

              {!finished ? (
                <div className="mt-5">
                  {/* progress dots */}
                  <div className="flex items-center gap-1.5">
                    {activeQuiz.questions.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i < current ? "bg-brand-400" : i === current ? "bg-brand-500" : "bg-slate-200",
                        )}
                      />
                    ))}
                  </div>

                  <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Question {current + 1} of {activeQuiz.questions.length}
                  </p>
                  <h3 className="mt-2 text-lg font-bold leading-snug text-slate-900">
                    {activeQuiz.questions[current].q}
                  </h3>

                  <div className="mt-5 flex flex-col gap-2.5">
                    {activeQuiz.questions[current].options.map((opt, i) => {
                      const selected = answers[current] === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => select(i)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all",
                            selected
                              ? "border-brand-400 bg-brand-50 text-brand-700 shadow-[0_8px_20px_-10px_rgba(90,110,255,0.5)]"
                              : "border-white/80 bg-white/70 text-slate-700 hover:border-brand-200 hover:bg-white",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                              selected ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 text-slate-400",
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      className="cursor-pointer rounded-full text-slate-500"
                      onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                      disabled={current === 0}
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    {current < activeQuiz.questions.length - 1 ? (
                      <Button
                        type="button"
                        onClick={next}
                        disabled={answers[current] === undefined}
                        className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400 disabled:from-slate-200 disabled:to-slate-200"
                      >
                        Next
                        <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={finish}
                        disabled={answers[current] === undefined}
                        className="cursor-pointer rounded-full bg-gradient-to-r from-mint-400 to-mint-500 font-semibold text-white hover:from-mint-300 hover:to-mint-400 disabled:from-slate-200 disabled:to-slate-200"
                      >
                        <Check className="size-4" />
                        Finish quiz
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/80 bg-gradient-to-b from-brand-50/60 to-lavender-50/60 p-6 text-center">
                    <p className="text-4xl font-extrabold tracking-tight text-aurora">
                      {Math.round((answers.filter((a, i) => a === activeQuiz.questions[i].answer).length / activeQuiz.questions.length) * 100)}%
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      You answered {answers.filter((a, i) => a === activeQuiz.questions[i].answer).length} of {activeQuiz.questions.length} correctly
                    </p>
                    <p className="text-xs text-slate-400">
                      {attempts[activeQuiz.id] >= 80 ? "Brilliant work — Zorbi is proud of you! 🎉" : "Review the questions below, then try again to beat your best."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {activeQuiz.questions.map((question, i) => {
                      const correct = answers[i] === question.answer;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl border px-4 py-3",
                            correct ? "border-mint-200 bg-mint-100/40" : "border-coral-200 bg-coral-100/30",
                          )}
                        >
                          <p className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                            {correct ? (
                              <Check className="mt-0.5 size-4 shrink-0 text-mint-500" />
                            ) : (
                              <X className="mt-0.5 size-4 shrink-0 text-coral-500" />
                            )}
                            {question.q}
                          </p>
                          <p className="ml-6 mt-1 text-xs font-medium text-slate-500">
                            Correct answer: <span className="font-bold text-slate-700">{question.options[question.answer]}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="cursor-pointer rounded-full text-slate-500"
                      onClick={() => setActiveQuiz(null)}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={restart}
                      className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400"
                    >
                      <RotateCcw className="size-4" />
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
