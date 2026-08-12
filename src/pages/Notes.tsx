import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalState } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS, SUBJECTS, SubjectBadge } from "@/lib/subjects";
import { NotebookPen, Plus, Search, Trash2 } from "lucide-react";
import type { Subject } from "@/lib/subjects";
import { useState } from "react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  excerpt: string;
  subject: Subject;
  updated: string;
}

const SEED_NOTES: Note[] = [
  {
    id: "n1",
    title: "Derivative rules — cheat sheet",
    excerpt: "Power rule, product rule, quotient rule and chain rule with one worked example each.",
    subject: "Mathematics",
    updated: "Today, 9:40 AM",
  },
  {
    id: "n2",
    title: "Newton's laws in one page",
    excerpt: "F = ma explained with friction, tension and the elevator problem from Chapter 5.",
    subject: "Physics",
    updated: "Yesterday, 6:15 PM",
  },
  {
    id: "n3",
    title: "Moles & stoichiometry",
    excerpt: "Mole conversions, limiting reactants and the formula sheet layout for the test.",
    subject: "Chemistry",
    updated: "2 days ago",
  },
  {
    id: "n4",
    title: "Essay structure for the exam",
    excerpt: "Thesis → topic sentences → evidence → analysis. Strong openers for 6 prompts.",
    subject: "English",
    updated: "3 days ago",
  },
];

export default function Notes() {
  const [notes, setNotes] = useLocalState<Note[]>("zorbi-notes", SEED_NOTES);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState<Subject>("Mathematics");

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(query.toLowerCase()),
  );

  const save = () => {
    if (!title.trim()) {
      toast("Add a title for your note.");
      return;
    }
    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        title: title.trim(),
        excerpt: body.trim() || "No content yet.",
        subject,
        updated: "Just now",
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setComposing(false);
    toast("Note saved");
  };

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast("Note deleted");
  };

  return (
    <AppShell
      title="Notes"
      subtitle="Capture ideas and lock in what you learn."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Toolbar */}
        <div className="glass flex flex-col gap-3 rounded-3xl p-4 lg:flex-row lg:items-center">
          <div className="glass-input flex flex-1 items-center gap-2 rounded-2xl px-3.5 py-2.5">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search notes..."
              className="h-8 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <Button
            type="button"
            onClick={() => {
              setComposing((v) => !v);
              setTitle("");
              setBody("");
            }}
            className="cursor-pointer rounded-xl bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white shadow-[0_10px_22px_-10px_rgba(90,110,255,0.7)] hover:from-brand-400 hover:to-lavender-400"
          >
            <Plus className="size-4" />
            {composing ? "Cancel" : "New note"}
          </Button>
        </div>

        {/* Composer */}
        {composing && (
          <GlassCard title="New note" action={<SubjectBadge subject={subject} />}>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  className="h-11 rounded-xl border-white/80 bg-white/70 shadow-sm"
                />
                <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                  <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border-white/80 bg-white/70 shadow-sm sm:w-[180px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-xl">
                    {SUBJECT_KEYS.map((s) => (
                      <SelectItem key={s} value={s} className="cursor-pointer">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your note..."
                className="min-h-[140px] rounded-xl border-white/80 bg-white/70 shadow-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={save}
                  className="cursor-pointer rounded-xl bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400"
                >
                  Save note
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Notes grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((n) => {
            const style = SUBJECTS[n.subject];
            return (
              <article
                key={n.id}
                className="glass group flex flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgba(70,95,200,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cn("flex size-10 items-center justify-center rounded-xl", style.tile)}>
                    <style.icon className="size-5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-coral-100/60 hover:text-coral-500 group-hover:opacity-100"
                    aria-label={`Delete ${n.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <h3 className="mt-4 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">
                  {n.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                  {n.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">{n.updated}</span>
                  <SubjectBadge subject={n.subject} />
                </div>
              </article>
            );
          })}

          {/* New note tile */}
          <button
            type="button"
            onClick={() => {
              setComposing(true);
              setTitle("");
              setBody("");
            }}
            className="flex min-h-[190px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/40 text-brand-500 transition-all hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50/70"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-[0_10px_22px_-10px_rgba(90,110,255,0.5)]">
              <NotebookPen className="size-6" />
            </span>
            <span className="text-sm font-semibold">Create a note</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
