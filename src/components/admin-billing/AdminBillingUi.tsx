"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox, Loader2, X } from "lucide-react";
import { Card, cn } from "@/components/ui/primitives";
import {
  CATEGORY_META,
  monthBounds,
  todayInput,
} from "@/lib/admin-billing/admin-billing-format";
import type { IplPaymentCategory } from "@/lib/admin-billing/admin-billing-types";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1120]";

export const inputClass =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-colors focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:border-gray-700 dark:bg-[#111827] dark:text-white dark:focus:ring-green-900";

export const primaryButtonClass = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-60",
  focusRing,
);

export const secondaryButtonClass = cn(
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#111827] dark:text-white dark:hover:bg-gray-800",
  focusRing,
);

/** Section card in the admin style (same as Project Status / Priority Projects). */
export function AdminPanel({
  title,
  description,
  aside,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const id = useId();
  return (
    <Card
      role="region"
      aria-labelledby={id}
      className={cn(
        "flex min-w-0 flex-col border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#1F2937]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
        <div className="min-w-0">
          <h2
            id={id}
            className="text-lg font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
        {aside && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {aside}
          </div>
        )}
      </div>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </Card>
  );
}

const METRIC_TONES = {
  green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  yellow:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
} as const;

/** Same anatomy as the Admin Dashboard metric cards, with a caption line. */
export function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  tone: keyof typeof METRIC_TONES;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <Card className="flex min-h-28 flex-col items-start gap-3 border-gray-200 p-4 xl:flex-row xl:items-center dark:border-gray-800 dark:bg-[#1F2937]">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full xl:h-11 xl:w-11",
          METRIC_TONES[tone],
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="w-full min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase leading-4 tracking-wide text-gray-500 dark:text-gray-300">
          {translateUi(label)}
        </p>
        <p className="mt-0.5 whitespace-nowrap text-base font-black leading-7 tabular-nums text-gray-900 sm:text-lg xl:text-xl dark:text-white">
          {value}
        </p>
        {caption && (
          <p className="text-[11px] leading-4 text-gray-500 sm:text-xs dark:text-gray-300">
            {translateUi(caption)}
          </p>
        )}
      </div>
    </Card>
  );
}

export function CategoryPill({ category }: { category: IplPaymentCategory }) {
  const { t: translateUi } = useLanguage();

  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {translateUi(meta.label)}
    </span>
  );
}

/** Bulan yang sedang dilihat; dipakai bersama tab IPL dan Kantong Donasi. */
export function PeriodPicker({
  period,
  onChange,
}: {
  period: string;
  onChange: (period: string) => void;
}) {
  const { t: translateUi } = useLanguage();

  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-gray-700 dark:text-gray-200"
      >
        {translateUi("Periode")}
      </label>
      <input
        id={id}
        type="month"
        value={period}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
        className={cn(inputClass, "min-w-0 flex-1 sm:flex-none")}
      />
    </div>
  );
}

/**
 * Riwayat di dalam periode: seluruh bulan, atau satu hari yang dipilih dari
 * kalender yang dikunci ke bulan periode tersebut. `day` kosong = sebulan.
 */
export function DayFilter({
  period,
  day,
  onChange,
}: {
  period: string;
  day: string;
  onChange: (day: string) => void;
}) {
  const { t: translateUi } = useLanguage();

  const id = useId();
  const { first, last } = monthBounds(period);
  const today = todayInput();
  const defaultDay = today >= first && today <= last ? today : first;
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <div
        role="group"
        aria-label={translateUi("Rentang riwayat")}
        className="grid w-full grid-cols-2 rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:inline-flex sm:w-auto dark:border-gray-700 dark:bg-[#111827]"
      >
        {(
          [
            ["", "Sebulan"],
            ["DAY", "Per hari"],
          ] as const
        ).map(([value, label]) => {
          const selected = value === "" ? !day : !!day;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(value === "" ? "" : day || defaultDay)}
              className={cn(
                "h-10 rounded-md px-3 text-xs font-semibold transition sm:h-9",
                focusRing,
                selected
                  ? "bg-white text-green-700 shadow-sm dark:bg-gray-800 dark:text-green-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white",
              )}
            >
              {translateUi(label)}
            </button>
          );
        })}
      </div>
      {day && (
        <>
          <label htmlFor={id} className="sr-only">
            {translateUi("Pilih tanggal")}
          </label>
          <input
            id={id}
            type="date"
            min={first}
            max={last}
            value={day}
            onChange={(event) => onChange(event.target.value || defaultDay)}
            className={cn(inputClass, "w-full sm:w-auto")}
          />
        </>
      )}
    </div>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
        <Inbox aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-white">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-300">
        {text}
      </p>
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  const { t: translateUi } = useLanguage();

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-500 dark:text-gray-300"
    >
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      {translateUi(label)}
    </div>
  );
}

export function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 px-6 py-12 text-center"
    >
      <p className="text-sm text-red-700 dark:text-red-400">
        {translateUi(message)}
      </p>
      <button type="button" onClick={onRetry} className={secondaryButtonClass}>
        {translateUi("Coba lagi")}
      </button>
    </div>
  );
}

/** Accessible modal: Escape / backdrop to close, focus moves into the dialog. */
export function AdminDialog({
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  className,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  const { t: translateUi } = useLanguage();

  const id = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl outline-none sm:rounded-2xl dark:border-gray-800 dark:bg-[#1F2937]",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800">
          <div className="min-w-0">
            <h2
              id={id}
              className="text-lg font-black text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={translateUi("Tutup")}
            onClick={onClose}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
              focusRing,
            )}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const thClass =
  "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6 dark:text-gray-300";
export const tdClass =
  "px-4 py-3.5 align-middle text-sm first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6";
