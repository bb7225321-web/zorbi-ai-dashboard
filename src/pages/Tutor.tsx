import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Zorbi } from "@/components/Zorbi";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Explain calculus derivatives",
  "Help me with Physics Chapter 6",
  "Quiz me on chemistry",
  "Review my English essay",
];

const STARTERS = [
  "I don't understand derivatives",
  "Summarize Chapter 5 of physics",
  "Create a study plan for finals",
];

export default function Tutor() {
  const messages = useQuery(api.tutor.messages);
  const sendMessage = useMutation(api.tutor.sendMessage);
  const generateReply = useMutation(api.tutor.generateReply);

  const [searchParams] = useSearchParams();
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [prefillHandled, setPrefillHandled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  // Auto-send a question carried over from the global search bar.
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q || prefillHandled) return;
    setPrefillHandled(true);
    setDraft("");
    if (!autoSentRef.current) {
      autoSentRef.current = true;
      void send(q);
    } else {
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, prefillHandled]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = async (raw: string) => {
    const content = raw.trim();
    if (!content || typing) return;
    setDraft("");
    await sendMessage({ content });
    setTyping(true);
    window.setTimeout(async () => {
      try {
        await generateReply();
      } finally {
        setTyping(false);
      }
    }, 1400);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void send(draft);
  };

  const empty = !messages || messages.length === 0;

  return (
    <AppShell
      title="AI Tutor"
      subtitle="Ask Zorbi anything — explanations, practice, and study plans."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
        {/* Quick starters when the conversation is empty */}
        {empty && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Try asking
            </span>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="glass-chip cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:text-brand-600"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Chat panel */}
        <section className="glass flex h-[calc(100dvh-230px)] min-h-[500px] flex-col overflow-hidden rounded-3xl">
          {/* Chat header */}
          <header className="flex items-center gap-3 border-b border-white/70 bg-white/50 px-5 py-3.5 backdrop-blur-md">
            <div className="relative">
              <Zorbi size={40} compact floating className="drop-shadow-[0_8px_16px_rgba(90,110,255,0.35)]" />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-mint-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                Zorbi <span className="text-xs font-semibold">· AI Tutor</span>
              </p>
              <p className="text-xs font-medium text-mint-500">
                Online — replies instantly
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600 sm:inline-flex">
              <Sparkles className="size-3" />
              Tutor mode
            </span>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="zorbi-scroll flex-1 space-y-5 overflow-y-auto px-5 py-6"
          >
            {empty && !typing && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <Zorbi size={110} className="drop-shadow-[0_18px_30px_rgba(90,110,255,0.3)]" />
                <div>
                  <p className="text-lg font-bold tracking-tight text-slate-900">
                    Hi, I'm Zorbi! 👋
                  </p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
                    Your AI study buddy. Ask me anything about your courses —
                    I'll explain it simply, step by step.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="glass-chip cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-all hover:-translate-y-0.5 hover:text-brand-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages?.map((m) => (
              <div
                key={m._id}
                className={cn(
                  "flex items-end gap-3",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" && (
                  <Zorbi
                    size={32}
                    compact
                    floating={false}
                    className="mb-1 shrink-0 drop-shadow-[0_6px_12px_rgba(90,110,255,0.3)]"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-brand-500 to-lavender-500 text-white shadow-[0_10px_24px_-12px_rgba(90,110,255,0.6)]"
                      : "rounded-bl-md border border-white/80 bg-white/80 text-slate-700 backdrop-blur-md",
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-end gap-3">
                <Zorbi
                  size={32}
                  compact
                  floating={false}
                  className="mb-1 shrink-0 drop-shadow-[0_6px_12px_rgba(90,110,255,0.3)]"
                />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/80 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur-md">
                  <span className="typing-dot size-1.5 rounded-full bg-brand-400" />
                  <span className="typing-dot size-1.5 rounded-full bg-brand-400" />
                  <span className="typing-dot size-1.5 rounded-full bg-brand-400" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <footer className="border-t border-white/70 bg-white/50 px-4 py-4 backdrop-blur-md">
            <form
              onSubmit={onSubmit}
              className="glass-input flex items-center gap-3 rounded-2xl p-2 pl-4"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                type="text"
                placeholder="Type your question..."
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!draft.trim() || typing}
                className="size-11 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-brand-500 to-lavender-500 text-white shadow-[0_10px_22px_-8px_rgba(90,110,255,0.7)] transition-transform hover:scale-105 hover:from-brand-400 hover:to-lavender-400 disabled:from-slate-200 disabled:to-slate-200 disabled:shadow-none"
                aria-label="Send message"
              >
                <ArrowUp className="size-5" />
              </Button>
            </form>
            <p className="mt-2.5 text-center text-[11px] font-medium text-slate-400">
              Zorbi can make mistakes — double-check important answers.
            </p>
          </footer>
        </section>
      </div>
    </AppShell>
  );
}
