import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Bell,
  ChevronDown,
  ClipboardList,
  Crown,
  FolderOpen,
  Gift,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  Search,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Zorbi } from "@/components/Zorbi";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Tutor", href: "/tutor", icon: Sparkles },
  { label: "My Materials", href: "/materials", icon: FolderOpen },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "Quizzes", href: "/quizzes", icon: ListChecks },
  { label: "Progress", href: "/progress", icon: TrendingUp },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Study Groups", href: "/groups", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = (item: NavItem) => {
    navigate(item.href);
    onNavigate?.();
  };

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1 zorbi-scroll">
      {NAV_ITEMS.map((item) => {
        const active = item.href === pathname;
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => handleClick(item)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
              active
                ? "bg-white/85 text-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_-10px_rgba(70,110,220,0.35)]"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-gradient-to-br from-brand-500 to-lavender-500 text-white shadow-[0_6px_14px_-6px_rgba(90,110,255,0.6)]"
                  : "bg-white/70 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:text-brand-600",
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex-1">{item.label}</span>
            {active && (
              <span className="size-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(80,110,255,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function PremiumCard() {
  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-lavender-500 p-[1px] shadow-[0_16px_36px_-16px_rgba(80,100,255,0.55)]">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-400 to-lavender-500 px-4 py-4">
        {/* soft light accents */}
        <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/25 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 size-24 rounded-full bg-lavender-200/40 blur-2xl" />

        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <Crown className="size-4 text-white" />
          </span>
          <p className="text-sm font-bold text-white">Go Premium</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/85">
          Unlock unlimited uploads, AI tutor 24/7, and more.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            toast("Premium is on its way", {
              description: "Upgrades arrive in the next Zorbi release.",
            })
          }
          className="mt-3 w-full cursor-pointer rounded-lg bg-white font-semibold text-brand-600 shadow-sm transition-transform hover:scale-[1.02] hover:bg-white"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}

function Logo() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/dashboard")}
      className="flex items-center gap-2.5 text-left"
      aria-label="Zorbi AI home"
    >
      <Zorbi size={38} compact floating={false} className="drop-shadow-[0_6px_14px_rgba(90,110,255,0.35)]" />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-tight text-slate-900">
          Zorbi <span className="text-aurora">AI</span>
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Learn Smarter
        </span>
      </span>
    </button>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();

  const goToTutor = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    navigate(q ? `/tutor?q=${encodeURIComponent(q)}` : "/tutor");
  };

  return (
    <form onSubmit={goToTutor} className="glass-input flex w-full max-w-xl items-center gap-2 rounded-2xl px-3.5 py-2">
      <Search className="size-4 shrink-0 text-slate-400" />
      <Input
        name="q"
        type="text"
        placeholder="Ask Zorbi anything..."
        className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
      />
      <Kbd className="hidden shrink-0 border border-slate-200 bg-white/80 text-slate-500 sm:inline-flex">
        Ctrl /
      </Kbd>
      <Button
        type="submit"
        size="icon"
        className="size-8 shrink-0 cursor-pointer rounded-full bg-gradient-to-br from-brand-500 to-lavender-500 text-white shadow-[0_6px_14px_-6px_rgba(90,110,255,0.65)] hover:from-brand-400 hover:to-lavender-400"
        aria-label="Ask Zorbi"
      >
        <Send className="size-3.5" />
      </Button>
    </form>
  );
}

function ProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || "Fahad";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.5 rounded-full border border-white/80 bg-white/70 py-1 pl-1 pr-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_-12px_rgba(52,80,160,0.3)] backdrop-blur-md transition-shadow hover:shadow-[0_10px_24px_-12px_rgba(52,80,160,0.4)]"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 via-lavender-400 to-lavender-500 text-sm font-bold text-white shadow-inner">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-left md:block">
            <span className="block text-xs font-semibold leading-tight text-slate-800">
              {displayName}
            </span>
            <span className="block text-[10px] font-medium leading-tight text-slate-400">
              Student
            </span>
          </span>
          <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/70 bg-white/95 p-1.5 backdrop-blur-xl">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-lavender-500 text-sm font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-800">{displayName}</span>
            <span className="block text-xs font-medium text-slate-400">
              {user?.email ?? "Student · Zorbi AI"}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-slate-600 focus:bg-brand-50 focus:text-brand-700"
          onClick={() => toast("Profile settings arrive in v2.")}
        >
          <Settings className="mr-2 size-4" />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-slate-600 focus:bg-brand-50 focus:text-brand-700"
          onClick={() => toast("You're on the Student plan. Go Premium to unlock more!")}
        >
          <Crown className="mr-2 size-4" />
          Manage plan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer rounded-lg text-coral-500 focus:bg-coral-100/70 focus:text-coral-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const upgrade = () =>
    toast("Premium is on its way", {
      description: "Upgrades arrive in the next Zorbi release.",
    });

  return (
    <div className="shell-bg min-h-screen text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col gap-6 px-5 py-6 lg:flex">
        <div className="glass flex h-full flex-col rounded-3xl px-4 pb-5 pt-5">
          <Logo />
          <div className="my-5 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
          <SidebarNav pathname={pathname} />
          <PremiumCard />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-[264px]">
        {/* Header */}
        <header className="sticky top-0 z-30 px-5 pt-5 lg:px-8">
          <div className="glass flex items-center gap-4 rounded-3xl px-4 py-3 lg:px-5">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] border-white/70 bg-white/90 p-4 backdrop-blur-2xl">
                <SheetTitle className="sr-only">Zorbi AI navigation</SheetTitle>
                <div className="flex h-full flex-col gap-5">
                  <Logo />
                  <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                  <PremiumCard />
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold tracking-tight text-slate-900 lg:text-xl">
                {title}
              </p>
              {subtitle && (
                <p className="truncate text-xs font-medium text-slate-400 lg:text-sm">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="hidden flex-1 justify-center md:flex">
              <GlobalSearch />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2.5 md:ml-0">
              <Button
                type="button"
                onClick={upgrade}
                className="hidden cursor-pointer rounded-full bg-gradient-to-r from-sun-400 to-coral-400 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(240,150,60,0.7)] hover:from-sun-300 hover:to-coral-300 sm:inline-flex"
              >
                <Zap className="size-4" />
                Upgrade to Pro
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative size-10 cursor-pointer rounded-full border border-white/80 bg-white/70 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md hover:bg-white hover:text-slate-700"
                onClick={() => toast("You're all caught up — no new notifications.")}
                aria-label="Notifications"
              >
                <Bell className="size-[18px]" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-coral-400 shadow-[0_0_0_3px_rgba(255,255,255,0.9)]" />
              </Button>
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Mobile search */}
        <div className="px-5 pt-4 md:hidden">
          <GlobalSearch />
        </div>

        <main className="flex-1 px-5 pb-10 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
