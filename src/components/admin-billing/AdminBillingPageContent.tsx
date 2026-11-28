"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Building2, HandHeart } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { currentPeriod } from "@/lib/admin-billing/admin-billing-format";
import { focusRing } from "./AdminBillingUi";
import { AdminDonationPanel } from "./AdminDonationPanel";
import { AdminIplPanel } from "./AdminIplPanel";

type Tab = "IPL" | "DONASI";
const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "IPL", label: "IPL", icon: Building2 },
  { id: "DONASI", label: "Kantong Donasi", icon: HandHeart },
];

export function AdminBillingPageContent() {
  const { t: translateUi } = useLanguage();

  const [tab, setTab] = useState<Tab>("IPL");
  const [period, setPeriod] = useState(currentPeriod);
  const refs = useRef<Record<Tab, HTMLButtonElement | null>>({
    IPL: null,
    DONASI: null,
  });

  // Keep the tab in sync with #ipl / #donasi (deep links and back/forward).
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === "#donasi" || hash === "#ipl")
        setTab(hash === "#donasi" ? "DONASI" : "IPL");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const select = (next: Tab, focus = false) => {
    setTab(next);
    window.history.replaceState(
      null,
      "",
      next === "DONASI" ? "#donasi" : "#ipl",
    );
    if (focus) refs.current[next]?.focus();
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    select(
      event.key === "Home"
        ? "IPL"
        : event.key === "End"
          ? "DONASI"
          : tab === "IPL"
            ? "DONASI"
            : "IPL",
      true,
    );
  };

  return (
    <div className="flex min-h-full w-full flex-col space-y-5 bg-slate-50 p-4 sm:space-y-6 sm:p-6 md:p-8 dark:bg-[#0B1120]">
      <div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {translateUi("Billing & Care")}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-300">
            {translateUi(
              "Kelola tagihan IPL warga dan kantong donasi perumahan.",
            )}
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={translateUi("Bagian Billing & Care")}
        onKeyDown={onKey}
        className="flex gap-1 border-b border-gray-200 dark:border-gray-800"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(node) => {
                refs.current[item.id] = node;
              }}
              type="button"
              role="tab"
              id={`admin-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`admin-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              className={cn(
                "-mb-px inline-flex h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 text-sm font-semibold transition sm:flex-none sm:gap-2 sm:px-4",
                focusRing,
                selected
                  ? "border-green-600 text-green-700 dark:border-green-400 dark:text-green-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white",
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {translateUi(item.label)}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`admin-panel-${tab}`}
        aria-labelledby={`admin-tab-${tab}`}
      >
        {tab === "IPL" ? (
          <AdminIplPanel period={period} onPeriodChange={setPeriod} />
        ) : (
          <AdminDonationPanel period={period} onPeriodChange={setPeriod} />
        )}
      </div>
    </div>
  );
}
