import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, FlaskConical, Presentation } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export const SUBJECTS = {
  Mathematics: {
    icon: BookOpen,
    tile: "bg-brand-50 text-brand-500",
    bar: "from-brand-400 to-brand-500",
    tag: "bg-brand-100 text-brand-600",
    dot: "bg-brand-400",
  },
  Physics: {
    icon: Presentation,
    tile: "bg-sun-100 text-sun-500",
    bar: "from-sun-400 to-coral-400",
    tag: "bg-sun-100 text-sun-600",
    dot: "bg-sun-400",
  },
  Chemistry: {
    icon: FlaskConical,
    tile: "bg-mint-100 text-mint-500",
    bar: "from-mint-400 to-mint-500",
    tag: "bg-mint-100 text-mint-600",
    dot: "bg-mint-400",
  },
  English: {
    icon: Award,
    tile: "bg-lavender-100 text-lavender-500",
    bar: "from-lavender-400 to-lavender-500",
    tag: "bg-lavender-100 text-lavender-600",
    dot: "bg-lavender-400",
  },
} as const;

export type Subject = keyof typeof SUBJECTS;

export const SUBJECT_KEYS = Object.keys(SUBJECTS) as Subject[];

export function SubjectIcon({
  subject,
  className,
}: {
  subject: Subject | string;
  className?: string;
}) {
  const Icon: ComponentType<{ className?: string }> =
    SUBJECTS[subject as Subject]?.icon ?? BookOpen;
  return <Icon className={className} />;
}

export function SubjectBadge({
  subject,
  className,
}: {
  subject: Subject | string;
  className?: string;
}) {
  const style = SUBJECTS[subject as Subject];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold",
        style?.tag ?? "bg-slate-100 text-slate-600",
        className,
      )}
    >
      {subject}
    </Badge>
  );
}

export function SubjectDot({ subject }: { subject: Subject | string }) {
  const style = SUBJECTS[subject as Subject];
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.9)]",
        style?.dot ?? "bg-slate-400",
      )}
    />
  );
}
