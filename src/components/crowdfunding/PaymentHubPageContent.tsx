"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Building2, HandHeart } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import { DonationSection } from "./DonationSection";
import { FinanceLoadState } from "./FinanceLoadState";
import { FinancePagination } from "./FinancePagination";
import { BILL_STATE_META, IplSection } from "./IplSection";
import { getIplOverview } from "./ipl-status";
import { PaymentHistory } from "./PaymentHistory";
import { PaymentHubHeader } from "./PaymentHubHeader";
import { segmentButtonClass, segmentTrackClass } from "./billing-ui";
import { useFinanceHub } from "./useFinanceHub";

type Tab = "IPL" | "DONASI";
const TAB_HASH: Record<Tab, string> = { IPL: "#ipl", DONASI: "#donasi" };

const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900";

export function PaymentHubPageContent() {
  const { t: translateUi } = useLanguage();

  const { data, loading, error, refresh, query, setQuery } = useFinanceHub(
    undefined,
    { expenseFund: "DONASI", orderFund: "IPL" },
  );
  const tab: Tab = query.orderFund === "DONASI" ? "DONASI" : "IPL";
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    IPL: null,
    DONASI: null,
  });

  const selectTab = (next: Tab, focus = false) => {
    if (focus) tabRefs.current[next]?.focus();
    if (next === tab) return;
    setQuery((current) => ({ ...current, orderFund: next, orderPage: 1 }));
    window.history.replaceState(null, "", TAB_HASH[next]);
  };

  // Keep the tab in sync with #ipl / #donasi, including links on an already open page.
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash !== TAB_HASH.DONASI && hash !== TAB_HASH.IPL) return;
      const next = hash === TAB_HASH.DONASI ? "DONASI" : "IPL";
      setQuery((current) =>
        current.orderFund === next
          ? current
          : { ...current, orderFund: next, orderPage: 1 },
      );
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [setQuery]);

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: Tab =
      event.key === "Home"
        ? "IPL"
        : event.key === "End"
          ? "DONASI"
          : tab === "IPL"
            ? "DONASI"
            : "IPL";
    selectTab(next, true);
  };

  // Small status dot on the IPL tab so warga notice a pending bill from the donation tab too.
  const iplState = data ? getIplOverview(data.summaryBills).state : "KOSONG";
  const iplDot =
    iplState === "TERLAMBAT" || iplState === "BELUM_BAYAR"
      ? BILL_STATE_META[iplState].dot
      : null;

  const tabs = [
    { id: "IPL" as const, label: "IPL", icon: Building2, dot: iplDot },
    {
      id: "DONASI" as const,
      label: "Kantong Donasi",
      icon: HandHeart,
      dot: null,
    },
  ];

  return (
    <PaymentPageShell width="wide">
      <PaymentHubHeader />
      <div className="sticky top-0 z-10 -mx-4 mt-6 flex justify-center bg-slate-50/85 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:px-0 dark:bg-slate-950/85">
        <div
          role="tablist"
          aria-label={translateUi("Bagian Billing & Care")}
          onKeyDown={onTabKey}
          className={cn(segmentTrackClass, "w-full max-w-md")}
        >
          {tabs.map((item) => {
            const selected = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[item.id] = node;
                }}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(item.id)}
                className={segmentButtonClass(
                  selected,
                  item.id === "DONASI" ? "blue" : "green",
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {translateUi(item.label)}
                {item.dot && (
                  <span className="flex items-center">
                    <span
                      aria-hidden="true"
                      className={cn("h-2 w-2 rounded-full", item.dot)}
                    />
                    <span className="sr-only">
                      {translateUi("ada tagihan yang perlu dibayar")}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        aria-busy={loading}
        className="mt-4 md:mt-6"
      >
        {!data ? (
          <div className={cardClass}>
            <FinanceLoadState error={error} retry={() => void refresh()} />
          </div>
        ) : tab === "IPL" ? (
          <IplSection
            bills={data.bills}
            summaryBills={data.summaryBills}
            total={data.billPagination.total}
            outstanding={data.outstanding}
            payable={data.payable}
            residence={data.residence}
            pagination={
              <FinancePagination
                label={translateUi("tagihan IPL")}
                {...data.billPagination}
                onPage={(billPage) =>
                  setQuery((current) => ({ ...current, billPage }))
                }
              />
            }
            footer={
              <>
                <PaymentHistory
                  orders={data.orders.filter((order) => order.kind === "ipl")}
                  total={data.orderPagination.total}
                  title={translateUi("Riwayat Pembayaran IPL")}
                  emptyText={translateUi(
                    "Pembayaran IPL Anda akan muncul di sini, termasuk pembayaran yang belum selesai.",
                  )}
                  footer={
                    <FinancePagination
                      label={translateUi("riwayat pembayaran IPL")}
                      {...data.orderPagination}
                      onPage={(orderPage) =>
                        setQuery((current) => ({ ...current, orderPage }))
                      }
                    />
                  }
                />
              </>
            }
          />
        ) : (
          <DonationSection
            balance={data.summary.donationBalance}
            thisMonth={data.donationIncomeThisMonth}
            collected={data.donationIncomeTotal}
            spent={data.donationSpent}
            incomes={data.donationIncomes}
            incomePagination={
              <FinancePagination
                label={translateUi("uang masuk")}
                {...data.donationIncomePagination}
                onPage={(incomePage) =>
                  setQuery((current) => ({ ...current, incomePage }))
                }
              />
            }
            expenses={data.expenses}
            expensePagination={
              <FinancePagination
                label={translateUi("uang keluar")}
                {...data.expensePagination}
                onPage={(expensePage) =>
                  setQuery((current) => ({ ...current, expensePage }))
                }
              />
            }
            footer={
              <PaymentHistory
                orders={data.orders.filter(
                  (order) => order.kind === "donation",
                )}
                total={data.orderPagination.total}
                title={translateUi("Donasi Saya")}
                emptyText={translateUi(
                  "Belum ada donasi dari Anda. Setiap donasi yang Anda berikan akan tercatat di sini.",
                )}
                footer={
                  <FinancePagination
                    label={translateUi("donasi saya")}
                    {...data.orderPagination}
                    onPage={(orderPage) =>
                      setQuery((current) => ({ ...current, orderPage }))
                    }
                  />
                }
              />
            }
          />
        )}
      </div>
    </PaymentPageShell>
  );
}
