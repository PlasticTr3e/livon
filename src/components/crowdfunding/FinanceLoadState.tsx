"use client";
import { useLanguage } from "@/context/LanguageContext";

export function FinanceLoadState({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="py-12" role="status" aria-live="polite">
      <p className="text-base text-slate-700 dark:text-slate-200">
        {error || translateUi("Memuat data keuangan…")}
      </p>
      {error && (
        <button
          type="button"
          onClick={retry}
          className="mt-4 min-h-11 rounded-lg bg-green-800 px-5 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700"
        >
          {translateUi("Coba lagi")}
        </button>
      )}
    </div>
  );
}
