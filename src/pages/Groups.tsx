import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalState } from "@/hooks/use-local-state";
import { cn } from "@/lib/utils";
import { SUBJECT_KEYS, SUBJECTS, SubjectBadge, SubjectDot } from "@/lib/subjects";
import {
  ArrowLeft,
  FolderOpen,
  MessageCircle,
  Plus,
  Send,
  Share2,
  Users,
} from "lucide-react";
import { SubjectIcon } from "@/lib/subjects";
import type { Subject } from "@/lib/subjects";
import { useState } from "react";
import { toast } from "sonner";

interface Member {
  name: string;
  initial: string;
  color: string;
}

interface Group {
  id: string;
  name: string;
  subject: Subject;
  description: string;
  members: Member[];
  materials: number;
  joined: boolean;
}

interface ChatMsg {
  author: string;
  text: string;
  time: string;
}

const SEED_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Calculus Crew",
    subject: "Mathematics",
    description: "Weekly problem sessions and derivative drills. Everyone helps everyone.",
    members: [
      { name: "Fahad", initial: "F", color: "from-brand-400 to-lavender-500" },
      { name: "Ayesha", initial: "A", color: "from-lavender-400 to-lavender-500" },
      { name: "Omar", initial: "O", color: "from-mint-400 to-mint-500" },
      { name: "Sara", initial: "S", color: "from-sun-400 to-coral-400" },
    ],
    materials: 14,
    joined: true,
  },
  {
    id: "g2",
    name: "Physics Study Force",
    subject: "Physics",
    description: "Chapter 5–6 mastery. We share problem sets and explain concepts out loud.",
    members: [
      { name: "Fahad", initial: "F", color: "from-brand-400 to-lavender-500" },
      { name: "Daniel", initial: "D", color: "from-sun-400 to-coral-400" },
      { name: "Mariam", initial: "M", color: "from-mint-400 to-mint-500" },
    ],
    materials: 9,
    joined: true,
  },
  {
    id: "g3",
    name: "Chemistry Formula Lab",
    subject: "Chemistry",
    description: "Formula sheets, reaction drills, and lab report reviews.",
    members: [
      { name: "Mariam", initial: "M", color: "from-mint-400 to-mint-500" },
      { name: "Zain", initial: "Z", color: "from-brand-400 to-lavender-500" },
      { name: "Lina", initial: "L", color: "from-lavender-400 to-lavender-500" },
    ],
    materials: 7,
    joined: false,
  },
];

const SEED_CHATS: Record<string, ChatMsg[]> = {
  g1: [
    { author: "Ayesha", text: "Did anyone finish the derivative worksheet? Q4 is tricky 😅", time: "9:02 AM" },
    { author: "Omar", text: "Q4 is a chain rule problem — write u = x² + 1 first, then it's easy.", time: "9:10 AM" },
    { author: "Fahad", text: "That helped, thanks Omar! Adding it to my notes.", time: "9:18 AM" },
  ],
  g2: [
    { author: "Daniel", text: "Chapter 6 summary is uploaded 📄", time: "Yesterday" },
    { author: "Mariam", text: "Great — let's quiz each other on friction on Friday?", time: "Yesterday" },
  ],
};

export default function Groups() {
  const [groups, setGroups] = useLocalState<Group[]>("zorbi-groups", SEED_GROUPS);
  const [chats, setChats] = useLocalState<Record<string, ChatMsg[]>>("zorbi-group-chats", SEED_CHATS);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Create dialog
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<Subject>("Mathematics");
  const [description, setDescription] = useState("");

  const activeGroup = groups.find((g) => g.id === openGroup) ?? null;
  const activeChat = openGroup ? chats[openGroup] ?? [] : [];

  const create = () => {
    if (!name.trim()) {
      toast("Give your group a name.");
      return;
    }
    const group: Group = {
      id: `grp-${Date.now()}`,
      name: name.trim(),
      subject,
      description: description.trim() || "A new study group on Zorbi.",
      members: [{ name: "Fahad", initial: "F", color: "from-brand-400 to-lavender-500" }],
      materials: 0,
      joined: true,
    };
    setGroups((prev) => [group, ...prev]);
    setChats((prev) => ({ ...prev, [group.id]: [] }));
    setName("");
    setDescription("");
    setCreating(false);
    toast(`"${group.name}" created — invite classmates to join!`);
  };

  const join = (id: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, joined: true, members: [...g.members, { name: "Fahad", initial: "F", color: "from-brand-400 to-lavender-500" }] }
          : g,
      ),
    );
    toast("You joined the group 🎉");
  };

  const send = () => {
    if (!draft.trim() || !openGroup) return;
    setChats((prev) => ({
      ...prev,
      [openGroup]: [
        ...(prev[openGroup] ?? []),
        { author: "Fahad", text: draft.trim(), time: "Just now" },
      ],
    }));
    setDraft("");
  };

  return (
    <AppShell
      title="Study Groups"
      subtitle="Learn together — share materials and chat with classmates."
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Group chat panel */}
        {activeGroup && (
          <GlassCard
            title={null}
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer rounded-full text-slate-500 hover:bg-white hover:text-brand-600"
                onClick={() => setOpenGroup(null)}
              >
                <ArrowLeft className="size-4" />
                All groups
              </Button>
            }
          >
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Group info */}
              <div className="lg:w-72 lg:shrink-0">
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", SUBJECTS[activeGroup.subject].tile)}>
                    <SubjectIcon subject={activeGroup.subject} className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{activeGroup.name}</h3>
                    <p className="text-xs font-medium text-slate-400">{activeGroup.members.length} members · {activeGroup.materials} materials</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{activeGroup.description}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Members</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {activeGroup.members.map((m) => (
                      <div key={m.name} className="flex items-center gap-2.5">
                        <span className={cn("flex size-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", m.color)}>
                          {m.initial}
                        </span>
                        <span className="text-sm font-medium text-slate-600">{m.name}</span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-mint-500">
                          <span className="size-1.5 rounded-full bg-mint-400" />
                          Online
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full cursor-pointer rounded-full border-white/80 bg-white/70"
                  onClick={() => toast("Material sharing with this group arrives in the next release.")}
                >
                  <Share2 className="size-4" />
                  Share a material
                </Button>
              </div>

              {/* Chat */}
              <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/60">
                <div className="zorbi-scroll flex-1 space-y-3 overflow-y-auto p-4">
                  {activeChat.map((m, i) => (
                    <div
                      key={i}
                      className={cn("flex items-end gap-2.5", m.author === "Fahad" ? "justify-end" : "justify-start")}
                    >
                      {m.author !== "Fahad" && (
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lavender-400 to-brand-500 text-[10px] font-bold text-white">
                          {m.author.charAt(0)}
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                          m.author === "Fahad"
                            ? "rounded-br-md bg-gradient-to-br from-brand-500 to-lavender-500 text-white"
                            : "rounded-bl-md border border-white/80 bg-white/90 text-slate-700",
                        )}
                      >
                        {m.author !== "Fahad" && (
                          <p className="mb-0.5 text-[10px] font-bold text-slate-400">{m.author}</p>
                        )}
                        {m.text}
                        <p className={cn("mt-1 text-right text-[10px]", m.author === "Fahad" ? "text-white/70" : "text-slate-300")}>
                          {m.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activeChat.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                      <MessageCircle className="size-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-500">No messages yet</p>
                      <p className="text-xs text-slate-400">Say hi to your group! 👋</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/80 bg-white/60 p-3">
                  <div className="glass-input flex items-center gap-2 rounded-2xl p-1.5 pl-4">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && send()}
                      type="text"
                      placeholder={`Message ${activeGroup.name}...`}
                      className="h-9 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={send}
                      disabled={!draft.trim()}
                      className="size-9 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-brand-500 to-lavender-500 text-white hover:from-brand-400 hover:to-lavender-400 disabled:from-slate-200 disabled:to-slate-200"
                      aria-label="Send message"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Groups grid */}
        {!activeGroup && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-500">
                {groups.filter((g) => g.joined).length} groups · {groups.reduce((s, g) => s + g.members.length, 0)} classmates
              </p>
              <Button
                type="button"
                onClick={() => setCreating(true)}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white shadow-[0_10px_22px_-10px_rgba(90,110,255,0.7)] hover:from-brand-400 hover:to-lavender-400"
              >
                <Plus className="size-4" />
                Create group
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => {
                const style = SUBJECTS[g.subject];
                return (
                  <article
                    key={g.id}
                    className="glass flex flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-26px_rgba(70,95,200,0.45)]"
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn("flex size-11 items-center justify-center rounded-xl", style.tile)}>
                        <style.icon className="size-5" />
                      </span>
                      <SubjectBadge subject={g.subject} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{g.name}</h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {g.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {g.members.slice(0, 4).map((m) => (
                          <span
                            key={m.name}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[10px] font-bold text-white",
                              m.color,
                            )}
                          >
                            {m.initial}
                          </span>
                        ))}
                        {g.members.length > 4 && (
                          <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-500">
                            +{g.members.length - 4}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <FolderOpen className="size-3.5" />
                        {g.materials} shared
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {g.joined ? (
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400"
                          onClick={() => setOpenGroup(g.id)}
                        >
                          <MessageCircle className="size-4" />
                          Open chat
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 cursor-pointer rounded-full bg-gradient-to-r from-mint-400 to-mint-500 font-semibold text-white hover:from-mint-300 hover:to-mint-400"
                          onClick={() => join(g.id)}
                        >
                          <Users className="size-4" />
                          Join group
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}

              {/* Create tile */}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-brand-200 bg-brand-50/40 text-brand-500 transition-all hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50/70"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-[0_10px_22px_-10px_rgba(90,110,255,0.5)]">
                  <Users className="size-6" />
                </span>
                <span className="text-sm font-semibold">Start a study group</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-md rounded-3xl border-white/80 bg-white/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
              Create a study group
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Invite classmates and share materials together.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              className="h-11 rounded-xl border-white/80 bg-white/70 shadow-sm"
            />
            <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
              <SelectTrigger className="h-11 cursor-pointer rounded-xl border-white/80 bg-white/70 shadow-sm">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-xl">
                {SUBJECT_KEYS.map((s) => (
                  <SelectItem key={s} value={s} className="cursor-pointer">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="min-h-[90px] rounded-xl border-white/80 bg-white/70 shadow-sm"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <SubjectDot subject={subject} />
                {subject} group
              </span>
              <Button
                type="button"
                onClick={create}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400"
              >
                Create group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
