"use client";

import { useLanguage } from "@/context/LanguageContext";
import { HandCoins } from "lucide-react";

/** Same header treatment as News & Updates: on the page background, divider below. */
export function PaymentHubHeader() {
  const { t: translateUi } = useLanguage();

  return (
    <div className="border-b border-gray-200 pb-6 dark:border-gray-800">
      <div className="mb-2.5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
          <HandCoins aria-hidden="true" className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          {translateUi("Billing & Care")}
        </h1>
      </div>
      <p className="ml-[52px] max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-300">
        {translateUi(
          "Bayar IPL bulanan rumah Anda dan ikut peduli lewat kantong donasi warga.",
        )}
      </p>
    </div>
  );
}
