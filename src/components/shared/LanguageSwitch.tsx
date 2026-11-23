"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <Languages aria-hidden="true" className="h-4 w-4" />
      <select
        aria-label={t("Bahasa antarmuka")}
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value === "en" ? "en" : "id")
        }
        className="min-h-10 w-11 cursor-pointer rounded bg-transparent text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 dark:focus-visible:outline-green-300"
      >
        <option value="id" lang="id">
          ID
        </option>
        <option value="en" lang="en">
          EN
        </option>
      </select>
    </label>
  );
}
