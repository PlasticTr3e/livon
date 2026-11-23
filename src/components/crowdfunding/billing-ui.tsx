"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/primitives";

/**
 * Shared building blocks so the IPL and Kantong Donasi tabs look like one system:
 * white cards, LIVON gradient icon tiles, and one gradient "balance card" per tab.
 */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600 dark:focus-visible:ring-offset-slate-950";

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

export type Tone = "green" | "blue" | "red" | "yellow";

/** Same gradient icon tile used in News, Community and CCTV headers. */
const ICON_TONES: Record<Tone, string> = {
  green: "from-green-500 to-green-700",
  blue: "from-blue-400 to-blue-600",
  red: "from-red-500 to-red-700",
  yellow: "from-yellow-300 to-yellow-500 text-yellow-950",
};

export function GradientIcon({
  icon: Icon,
  tone = "green",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
        ICON_TONES[tone],
        size === "md" ? "h-10 w-10" : "h-9 w-9",
      )}
    >
      <Icon className={size === "md" ? "h-5 w-5" : "h-4 w-4"} />
    </span>
  );
}

export function CardHeader({
  id,
  icon,
  tone = "green",
  title,
  caption,
  aside,
}: {
  id?: string;
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  caption?: string;
  aside?: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
      <GradientIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <h2
          id={id}
          className="text-base font-bold text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        {caption && (
          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
            {translateUi(caption)}
          </p>
        )}
      </div>
      {aside}
    </header>
  );
}

export function CountBadge({ value }: { value: number }) {
  const { locale: uiLocale } = useLanguage();

  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      {value.toLocaleString(uiLocale)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Balance card: the one strong gradient surface per tab               */
/* ------------------------------------------------------------------ */

type BalanceTone = {
  surface: string;
  action: string;
  iconBox: string;
  ring: string;
};

const BALANCE_TONES: Record<Tone, BalanceTone> = {
  green: {
    surface: "from-green-700 via-green-800 to-green-900 text-white",
    action: "bg-white text-green-900 hover:bg-green-50",
    iconBox: "bg-white/15 ring-white/20",
    ring: "border-white/[0.07]",
  },
  blue: {
    surface: "from-blue-600 via-blue-700 to-blue-900 text-white",
    action: "bg-white text-blue-900 hover:bg-blue-50",
    iconBox: "bg-white/15 ring-white/20",
    ring: "border-white/[0.07]",
  },
  red: {
    surface: "from-red-600 via-red-700 to-red-900 text-white",
    action: "bg-white text-red-900 hover:bg-red-50",
    iconBox: "bg-white/15 ring-white/20",
    ring: "border-white/[0.07]",
  },
  // Belum dibayar: kuning LIVON dengan teks gelap (teks putih di kuning tidak terbaca).
  yellow: {
    surface: "from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-950",
    action: "bg-yellow-950 text-white hover:bg-black",
    iconBox: "bg-white/50 ring-yellow-950/10",
    ring: "border-white/30",
  },
};

export function balanceActionClass(tone: Tone) {
  return cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold shadow-sm transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
    BALANCE_TONES[tone].action,
  );
}

export function BalanceCard({
  tone,
  icon: Icon,
  label,
  status,
  amountLabel,
  amount,
  meta,
  action,
}: {
  tone: Tone;
  icon: LucideIcon;
  label: string;
  status?: ReactNode;
  amountLabel: string;
  amount: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <article
      className={cn(
        "relative isolate flex min-h-[260px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg shadow-slate-900/10 sm:p-7",
        BALANCE_TONES[tone].surface,
      )}
    >
      {/* Concentric rings: the same motif the original IPL pocket card used. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 -z-10 h-56 w-56 rounded-full border-[28px]",
          BALANCE_TONES[tone].ring,
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-4 -z-10 h-48 w-48 rounded-full border-[20px] border-white/[0.05]"
      />

      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset",
              BALANCE_TONES[tone].iconBox,
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
          {translateUi(label)}
        </p>
        {typeof status === "string" ? translateUi(status) : status}
      </div>

      <div className="mt-auto pt-8">
        <p className="text-sm font-medium">{amountLabel}</p>
        <p className="mt-1 text-[2.5rem] font-black leading-none tracking-tight tabular-nums sm:text-5xl">
          {amount}
        </p>
      </div>

      {(meta || action) && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-3">{meta}</div>
          {action}
        </div>
      )}
    </article>
  );
}

/** Label + value pair printed directly on the balance card (inherits card text colour). */
export function BalanceFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="flex items-center gap-2.5">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <div className="leading-tight">
        <dt className="text-xs font-medium">{translateUi(label)}</dt>
        <dd className="text-sm font-bold">{value}</dd>
      </div>
    </div>
  );
}

export function BalanceChip({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/15">
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented switch, shared by the page tabs and the ledger switch     */
/* ------------------------------------------------------------------ */

export const segmentTrackClass =
  "grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

const SEGMENT_ACTIVE = {
  green: "bg-gradient-to-r from-green-700 to-green-800",
  blue: "bg-gradient-to-r from-blue-600 to-blue-700",
} as const;

export function segmentButtonClass(
  selected: boolean,
  tone: keyof typeof SEGMENT_ACTIVE = "green",
) {
  return cn(
    "relative flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600",
    selected
      ? cn(SEGMENT_ACTIVE[tone], "text-white shadow-md")
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
  );
}
