import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  FileText,
  FolderOpen,
  HardDrive,
  MessageCircleQuestion,
  Presentation,
  Search,
  Upload,
} from "lucide-react";
import type { Subject } from "@/lib/subjects";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface Material {
  id: string;
  name: string;
  subject: Subject | "Uncategorized";
  size: string;
  date: string;
}

const SEED_MATERIALS: Material[] = [
  { id: "m1", name: "Calculus Notes.pdf", subject: "Mathematics", size: "2.4 MB", date: "Today" },
  { id: "m2", name: "Physics Chapter 5.pptx", subject: "Physics", size: "5.7 MB", date: "Yesterday" },
  { id: "m3", name: "Chemistry Formula Sheet.pdf", subject: "Chemistry", size: "1.8 MB", date: "2 days ago" },
  { id: "m4", name: "English Essay Guide.docx", subject: "English", size: "3.2 MB", date: "3 days ago" },
  { id: "m5", name: "Mathematics Practice Set 3.pdf", subject: "Mathematics", size: "1.1 MB", date: "Last week" },
  { id: "m6", name: "Physics Lab Report Template.docx", subject: "Physics", size: "0.9 MB", date: "Last week" },
];

function fileMeta(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return { icon: FileText, tile: "bg-coral-100 text-coral-500" };
  if (lower.endsWith(".pptx") || lower.endsWith(".ppt"))
    return { icon: Presentation, tile: "bg-sun-100 text-sun-500" };
  if (lower.endsWith(".docx") || lower.endsWith(".doc"))
    return { icon: FileText, tile: "bg-brand-100 text-brand-500" };
  return { icon: FileText, tile: "bg-lavender-100 text-lavender-500" };
}

export default function Materials() {
  const [materials, setMaterials] = useLocalState<Material[]>(
    "zorbi-materials",
    SEED_MATERIALS,
  );
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<"All" | Subject | "Uncategorized">("All");
  const [uploadSubject, setUploadSubject] = useState<Subject>("Mathematics");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = materials.filter((m) => {
    const matchesQuery = m.name.toLowerCase().includes(query.toLowerCase());
    const matchesSubject = subject === "All" || m.subject === subject;
    return matchesQuery && matchesSubject;
  });

  const totalSizeMB = materials.reduce((sum, m) => {
    const n = parseFloat(m.size);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file, i) => {
      const sizeMB = file.size / (1024 * 1024);
      return {
        id: `up-${Date.now()}-${i}`,
        name: file.name,
        subject: uploadSubject,
        size: `${sizeMB.toFixed(1)} MB`,
        date: "Just now",
      } satisfies Material;
    });
    setMaterials((prev) => [...added, ...prev]);
    toast(`Uploaded ${added.length} file${added.length > 1 ? "s" : ""}`, {
      description: `${added.map((a) => a.name).join(", ")} — Zorbi indexed it for study.`,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <AppShell
      title="My Materials"
      subtitle="Upload, organize, and quiz yourself on anything."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { icon: FolderOpen, label: "Total files", value: String(materials.length), tint: "bg-brand-50 text-brand-500" },
            { icon: HardDrive, label: "Storage used", value: `${totalSizeMB.toFixed(1)} MB`, tint: "bg-lavender-100 text-lavender-500" },
            { icon: Search, label: "Subjects", value: String(SUBJECT_KEYS.length), tint: "bg-mint-100 text-mint-500" },
            { icon: MessageCircleQuestion, label: "AI-ready", value: "100%", tint: "bg-sun-100 text-sun-500" },
          ].map((s) => (
            <div key={s.label} className="glass flex items-center gap-3.5 rounded-2xl p-4">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", s.tint)}>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold tracking-tight text-slate-900">{s.value}</p>
                <p className="truncate text-xs font-medium text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <GlassCard>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="glass-input flex flex-1 items-center gap-2 rounded-2xl px-3.5 py-2.5">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search materials..."
                className="h-8 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={subject} onValueChange={(v) => setSubject(v as typeof subject)}>
                <SelectTrigger className="w-[150px] cursor-pointer rounded-xl border-white/80 bg-white/70 text-sm shadow-sm">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-xl">
                  <SelectItem value="All" className="cursor-pointer">All subjects</SelectItem>
                  {SUBJECT_KEYS.map((s) => (
                    <SelectItem key={s} value={s} className="cursor-pointer">{s}</SelectItem>
                  ))}
                  <SelectItem value="Uncategorized" className="cursor-pointer">Uncategorized</SelectItem>
                </SelectContent>
              </Select>

              <Select value={uploadSubject} onValueChange={(v) => setUploadSubject(v as Subject)}>
                <SelectTrigger className="hidden w-[150px] cursor-pointer rounded-xl border-white/80 bg-white/70 text-sm shadow-sm md:flex">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-xl">
                  {SUBJECT_KEYS.map((s) => (
                    <SelectItem key={s} value={s} className="cursor-pointer">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white shadow-[0_10px_22px_-10px_rgba(90,110,255,0.7)] hover:from-brand-400 hover:to-lavender-400"
              >
                <Upload className="size-4" />
                Upload files
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Material list */}
        <GlassCard
          title={`Materials (${filtered.length})`}
          action={
            <span className="text-xs font-medium text-slate-400">
              PDF · PPTX · DOCX supported
            </span>
          }
        >
          <ul className="flex flex-col gap-2.5">
            {filtered.map((m) => {
              const meta = fileMeta(m.name);
              const style = SUBJECTS[m.subject as Subject];
              return (
                <li
                  key={m.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_14px_30px_-16px_rgba(52,80,160,0.4)] sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", meta.tile)}>
                      <meta.icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{m.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {m.size} · {m.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    {style && <span className={cn("hidden size-2 rounded-full md:block", style.dot)} />}
                    <SubjectBadge subject={m.subject} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer rounded-full text-slate-500 hover:bg-white hover:text-brand-600"
                      onClick={() => toast(`Opening ${m.name}…`, { description: "The viewer arrives in the next release." })}
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="cursor-pointer rounded-full bg-brand-50 font-semibold text-brand-600 hover:bg-brand-100 hover:text-brand-700"
                      onClick={() => navigate(`/tutor?q=${encodeURIComponent(`Explain the key ideas in ${m.name.replace(/\.[^.]+$/, "")}`)}`)}
                    >
                      <MessageCircleQuestion className="size-3.5" />
                      Ask Zorbi
                    </Button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
                  <FolderOpen className="size-7" />
                </span>
                <p className="text-sm font-semibold text-slate-600">No materials found</p>
                <p className="text-xs text-slate-400">Try a different search or upload a new file.</p>
              </div>
            )}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
