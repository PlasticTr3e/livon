"use client";

import { useLanguage } from "@/context/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { focusRing } from "./billing-ui";

const buttonClass = cn(
  "inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  focusRing,
);

export function FinancePagination({
  label,
  page,
  totalPages,
  onPage,
}: {
  label: string;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const { t: translateUi } = useLanguage();

  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label={translateUi("Halaman") + " " + translateUi(label)}
      className="mt-4 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        className={buttonClass}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {translateUi("Sebelumnya")}
      </button>
      <span className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
        {translateUi("Halaman")}{" "}
        <strong className="font-semibold text-slate-900 dark:text-white">
          {page}
        </strong>{" "}
        {translateUi("dari ")}
        {totalPages}
      </span>
      <button
        type="button"
        className={buttonClass}
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        {translateUi("Berikutnya")}
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
