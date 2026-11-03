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
  isLoading?: boolean;
  /** `compact` for dense dashboards such as the admin finance page. */
  size?: "default" | "compact";
};

const sizes = {
  default: {
    card: "p-4 sm:p-6",
    label: "text-[10px] sm:text-xs sm:tracking-[0.16em]",
    icon: "h-9 w-9 sm:h-12 sm:w-12",
    glyph: "h-4 w-4 sm:h-5 sm:w-5",
    value: "mt-3 text-xl sm:mt-4 sm:text-2xl",
    skeleton: "mt-3 h-7 sm:mt-5 sm:h-9",
    caption: "text-xs sm:text-sm",
  },
  compact: {
    card: "p-4",
    label: "text-[10px] sm:text-[11px]",
    icon: "h-8 w-8 sm:h-9 sm:w-9",
    glyph: "h-4 w-4",
    value: "mt-2 text-lg sm:text-xl",
    skeleton: "mt-2 h-7",
    caption: "text-xs",
  },
} as const;

export function FinanceStatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  isLoading = false,
  size = "default",
}: FinanceStatCardProps) {
  const styles = tones[tone];
  const dims = sizes[size];

  return (
    <article
      aria-busy={isLoading}
      className={cn(
        "flex flex-col rounded-2xl border shadow-sm",
        dims.card,
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          className={cn(
            "font-bold uppercase leading-4 tracking-[0.14em] text-slate-600 dark:text-slate-400",
            dims.label,
          )}
        >
          {label}
        </h2>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl",
            dims.icon,
            styles.icon,
          )}
        >
          <Icon aria-hidden="true" className={dims.glyph} />
        </span>
      </div>
      {isLoading ? (
        <span
          aria-hidden="true"
          className={cn(
            "w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800",
            dims.skeleton,
          )}
        />
      ) : (
        <p
          className={cn(
            "font-black tracking-tight tabular-nums",
            dims.value,
            styles.value,
          )}
        >
          {value}
        </p>
      )}
      {caption && !isLoading && (
        <p className={cn("mt-1 text-slate-400", dims.caption)}>{caption}</p>
      )}
    </article>
  );
}
