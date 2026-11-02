import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";

const tones = {
  green: {
    card: "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950",
    icon: "bg-green-200/70 text-green-700 dark:bg-green-900/60 dark:text-green-300",
    value: "text-green-800 dark:text-green-200",
  },
  blue: {
    card: "border-green-200 bg-slate-50 dark:border-green-900/60 dark:bg-slate-950",
    icon: "bg-blue-200/70 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    value: "text-slate-800 dark:text-slate-200",
  },
  amber: {
    card: "border-green-200 bg-slate-50 dark:border-green-900/60 dark:bg-slate-950",
    icon: "bg-yellow-200 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300",
    value: "text-slate-800 dark:text-slate-200",
  },
  down: {
    card: "border-green-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950",
    icon: "bg-red-200/70 text-red-700 dark:bg-red-900/60 dark:text-red-300",
    value: "text-red-800 dark:text-red-200",
  },
  brown: {
    card: "border-green-200 bg-slate-50 dark:border-orange-900/60 dark:bg-slate-950",
    icon: "bg-orange-200/70 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    value: "text-slate-800 dark:text-slate-200",
  },
} as const;

export type FinanceStatTone = keyof typeof tones;

type FinanceStatCardProps = {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  tone: FinanceStatTone;
};

export function FinanceStatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: FinanceStatCardProps) {
  const styles = tones[tone];

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border p-4 shadow-sm sm:p-6",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-slate-600 sm:text-xs sm:tracking-[0.16em] dark:text-slate-400">
          {label}
        </h2>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
            styles.icon,
          )}
        >
          <Icon aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-xl font-black tracking-tight tabular-nums sm:mt-5 sm:text-3xl",
          styles.value,
        )}
      >
        {value}
      </p>
      {caption && (
        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{caption}</p>
      )}
    </article>
  );
}
