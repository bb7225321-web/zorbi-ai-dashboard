import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Zorbi } from "@/components/Zorbi";
import {
  Bell,
  Crown,
  Globe,
  Laptop,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="cursor-pointer data-[state=checked]:bg-brand-500"
      />
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "Fahad");
  const [email] = useState(user?.email || "fahad@student.example.com");
  const [language, setLanguage] = useState("English (US)");
  const [notifications, setNotifications] = useState({
    quizReminders: true,
    streakAlerts: true,
    groupMessages: true,
    productUpdates: false,
  });
  const [privacy, setPrivacy] = useState({
    shareProgress: true,
    analytics: false,
  });
  const [appearance, setAppearance] = useState<"light" | "system" | "dark">("light");

  const updateNotification = (key: keyof typeof notifications, v: boolean) =>
    setNotifications((prev) => ({ ...prev, [key]: v }));

  const pickAppearance = (mode: "light" | "system" | "dark") => {
    setAppearance(mode);
    if (mode !== "light") {
      toast("Zorbi stays in light mode for now", {
        description: "Dark mode is coming in a later release.",
      });
    }
  };

  return (
    <AppShell title="Settings" subtitle="Manage your profile, account, and preferences.">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        {/* Profile + Subscription */}
        <div className="grid gap-5 lg:grid-cols-3">
          <GlassCard title="Profile" className="lg:col-span-2">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <span className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 via-lavender-400 to-lavender-500 text-3xl font-extrabold text-white shadow-[0_14px_30px_-12px_rgba(90,110,255,0.6)]">
                  {name.charAt(0).toUpperCase()}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer rounded-full text-brand-600 hover:bg-brand-50"
                  onClick={() => toast("Avatar upload arrives in the next release.")}
                >
                  Change photo
                </Button>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Full name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl border-white/80 bg-white/70 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Email</label>
                  <Input
                    value={email}
                    readOnly
                    className="mt-1.5 h-11 rounded-xl border-white/80 bg-white/50 text-slate-400 shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Role</label>
                  <Input value="Student" readOnly className="mt-1.5 h-11 rounded-xl border-white/80 bg-white/50 text-slate-400 shadow-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">School</label>
                  <Input value="Westfield High School" className="mt-1.5 h-11 rounded-xl border-white/80 bg-white/70 shadow-sm" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="cursor-pointer rounded-full text-slate-500">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => toast("Profile saved ✓")}
                className="cursor-pointer rounded-full bg-gradient-to-r from-brand-500 to-lavender-500 font-semibold text-white hover:from-brand-400 hover:to-lavender-400"
              >
                Save changes
              </Button>
            </div>
          </GlassCard>

          <GlassCard title="Subscription">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-lavender-500 p-4 text-white shadow-[0_18px_40px_-18px_rgba(80,100,255,0.6)]">
              <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/25 blur-2xl" />
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Crown className="size-4" />
                </span>
                <p className="text-sm font-bold">Student plan</p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/85">
                Free forever · Unlimited questions · 1 GB uploads
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full cursor-pointer rounded-lg bg-white font-semibold text-brand-600 hover:bg-white"
                onClick={() =>
                  toast("Premium is on its way", {
                    description: "Unlimited uploads and AI Tutor 24/7 arrive in the next release.",
                  })
                }
              >
                <Sparkles className="size-3.5" />
                Upgrade to Pro
              </Button>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-slate-500">
              {[
                ["Unlimited uploads", "Pro"],
                ["AI Tutor 24/7", "Pro"],
                ["Advanced analytics", "Pro"],
                ["5 uploads / week", "Student"],
                ["AI Tutor 20 questions / day", "Student"],
              ].map(([label, plan]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      plan === "Pro" ? "bg-lavender-100 text-lavender-600" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {plan}
                  </span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* Appearance + Language */}
        <div className="grid gap-5 lg:grid-cols-2">
          <GlassCard title="Appearance" action={<Palette className="size-4 text-slate-300" />}>
            <div className="grid grid-cols-3 gap-3">
              {([
                { mode: "light" as const, icon: Sun, label: "Light" },
                { mode: "system" as const, icon: Laptop, label: "System" },
                { mode: "dark" as const, icon: Moon, label: "Dark" },
              ]).map((o) => (
                <button
                  key={o.mode}
                  type="button"
                  onClick={() => pickAppearance(o.mode)}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-semibold transition-all",
                    appearance === o.mode
                      ? "border-brand-400 bg-brand-50 text-brand-700 shadow-[0_8px_20px_-10px_rgba(90,110,255,0.5)]"
                      : "border-white/80 bg-white/60 text-slate-500 hover:border-brand-200",
                  )}
                >
                  <o.icon className="size-5" />
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Zorbi is designed to feel bright and calm — light mode recommended.
            </p>
          </GlassCard>

          <GlassCard title="Language" action={<Globe className="size-4 text-slate-300" />}>
            <div className="flex flex-col gap-3">
              <Select value={language} onValueChange={(v) => { setLanguage(v); toast("Language preference saved."); }}>
                <SelectTrigger className="h-11 cursor-pointer rounded-xl border-white/80 bg-white/70 shadow-sm">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-xl">
                  {["English (US)", "English (UK)", "العربية", "اردو", "Français", "Deutsch"].map((l) => (
                    <SelectItem key={l} value={l} className="cursor-pointer">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs font-medium text-slate-400">
                The AI tutor responds in the language you ask in — try it!
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Notifications + Privacy */}
        <div className="grid gap-5 lg:grid-cols-2">
          <GlassCard title="Notifications" action={<Bell className="size-4 text-slate-300" />}>
            <div className="flex flex-col gap-2.5">
              <ToggleRow
                title="Quiz & assignment reminders"
                desc="Get notified before deadlines"
                checked={notifications.quizReminders}
                onChange={(v) => updateNotification("quizReminders", v)}
              />
              <ToggleRow
                title="Streak alerts"
                desc="A gentle nudge when your streak is at risk"
                checked={notifications.streakAlerts}
                onChange={(v) => updateNotification("streakAlerts", v)}
              />
              <ToggleRow
                title="Group messages"
                desc="New messages in your study groups"
                checked={notifications.groupMessages}
                onChange={(v) => updateNotification("groupMessages", v)}
              />
              <ToggleRow
                title="Product updates"
                desc="New features and tips from Zorbi"
                checked={notifications.productUpdates}
                onChange={(v) => updateNotification("productUpdates", v)}
              />
            </div>
          </GlassCard>

          <GlassCard title="Privacy" action={<ShieldCheck className="size-4 text-slate-300" />}>
            <div className="flex flex-col gap-2.5">
              <ToggleRow
                title="Share learning progress"
                desc="Allow classmates to see your subject mastery"
                checked={privacy.shareProgress}
                onChange={(v) => setPrivacy((prev) => ({ ...prev, shareProgress: v }))}
              />
              <ToggleRow
                title="Anonymous analytics"
                desc="Help improve Zorbi with usage data"
                checked={privacy.analytics}
                onChange={(v) => setPrivacy((prev) => ({ ...prev, analytics: v }))}
              />
              <div className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5">
                <p className="text-sm font-semibold text-slate-800">Data & exports</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Your conversations with the AI tutor are private to your account.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer rounded-full border-white/80 bg-white/70"
                    onClick={() => toast("Your data export is being prepared.")}
                  >
                    <User className="size-3.5" />
                    Export my data
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer rounded-full text-coral-500 hover:bg-coral-100/60"
                    onClick={() => toast("Account deletion requires email confirmation.")}
                  >
                    Delete account
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* About */}
        <GlassCard title={null}>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <Zorbi size={72} compact floating className="drop-shadow-[0_14px_24px_rgba(90,110,255,0.35)]" />
            <div>
              <p className="text-base font-bold text-slate-900">
                Zorbi <span className="text-aurora">AI</span> · v1.0
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Learn smarter with your AI study buddy. Made with 💙 for students.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
