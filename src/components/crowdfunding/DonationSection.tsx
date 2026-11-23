"use client";
import { getDisplayLocale } from "@/lib/i18n/display";

import { useLanguage } from "@/context/LanguageContext";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  HeartHandshake,
  Inbox,
  VenetianMask,
  Wallet,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { TransactionListItem } from "@/lib/finance/finance-types";
import {
  formatActivityTime,
  formatRupiah,
  PAYMENT_ROUTES,
} from "@/lib/payment/billing";
import type { DonationIncomeItem } from "@/services/finance/donation-feed";
import {
  BalanceCard,
  balanceActionClass,
  CardHeader,
  cardClass,
  focusRing,
  GradientIcon,
  segmentButtonClass,
  segmentTrackClass,
} from "./billing-ui";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "W"
  );
}

const AVATAR_TONES = [
  "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
];

function toneFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/* ------------------------------------------------------------------ */
/* Summary: balance card + totals                                      */
/* ------------------------------------------------------------------ */

function TotalRow({
  icon,
  tone,
  label,
  amount,
  caption,
}: {
  icon: typeof Wallet;
  tone: "green" | "blue" | "red";
  label: string;
  amount: number;
  caption: string;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
      <GradientIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {translateUi(label)}
        </p>
        <p className="mt-0.5 text-xl font-black tabular-nums text-slate-900 dark:text-white">
          {formatRupiah(amount)}
        </p>
      </div>
      <span className="shrink-0 text-xs text-slate-600 dark:text-slate-400">
        {translateUi(caption)}
      </span>
    </div>
  );
}

function DonationSummary({
  balance,
  thisMonth,
  spent,
}: {
  balance: number;
  thisMonth: { amount: number; count: number };
  spent: { amount: number; count: number };
}) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const monthName = new Date().toLocaleDateString(uiLocale, { month: "long" });
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
      <BalanceCard
        tone="blue"
        icon={HeartHandshake}
        label={translateUi("Kantong Donasi Warga")}
        amountLabel="Total kas donasi"
        amount={formatRupiah(balance)}
        action={
          <Link
            href={PAYMENT_ROUTES.donationDetail}
            className={balanceActionClass("blue")}
          >
            {translateUi("Donasi sekarang")}
          </Link>
        }
      />

      <section
        aria-labelledby="donation-totals"
        className={cn(cardClass, "flex flex-col")}
      >
        <CardHeader
          id="donation-totals"
          icon={Wallet}
          tone="blue"
          title={translateUi("Ringkasan Kas")}
          caption={translateUi("Pergerakan dana kantong donasi")}
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <TotalRow
            icon={ArrowDownLeft}
            tone="green"
            label={translateUi("Donasi bulan ini ({0})", { 0: monthName })}
            amount={thisMonth.amount}
            caption={translateUi("{0} donasi", {
              0: thisMonth.count.toLocaleString(getDisplayLocale()),
            })}
          />
          <TotalRow
            icon={ArrowUpRight}
            tone="red"
            label={translateUi("Sudah disalurkan")}
            amount={spent.amount}
            caption={translateUi("{0} penyaluran", {
              0: spent.count.toLocaleString(getDisplayLocale()),
            })}
          />
        </div>
        <p className="mt-auto border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-600 sm:px-6 dark:border-slate-800 dark:text-slate-400">
          {translateUi(
            "Setiap donasi dan penarikan tercatat terbuka untuk seluruh warga.",
          )}
        </p>
      </section>
    </div>
  );
}

function EmptyLedger({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Inbox aria-hidden="true" className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </p>
      <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">
        {text}
      </p>
    </div>
  );
}

function DonorAvatar({ item }: { item: DonationIncomeItem }) {
  return item.anonymous ? (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white"
    >
      <VenetianMask className="h-4 w-4" />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        toneFor(item.donorName),
      )}
    >
      {initials(item.donorName)}
    </span>
  );
}

function AdminBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span
        aria-hidden="true"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          toneFor(name),
        )}
      >
        {initials(name)}
      </span>
      {name}
    </span>
  );
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString(getDisplayLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const thClass =
  "px-4 py-3 text-left text-xs font-semibold text-slate-600 first:pl-6 last:pr-6 dark:text-slate-400";
const tdClass = "px-4 py-4 align-top first:pl-6 last:pr-6";

/** Desktop table for uang masuk. */
function IncomeTable({ items }: { items: DonationIncomeItem[] }) {
  const { t: translateUi } = useLanguage();

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-slate-800/50">
        <tr>
          <th scope="col" className={thClass}>
            {translateUi("Tanggal")}
          </th>
          <th scope="col" className={thClass}>
            {translateUi("Donatur")}
          </th>
          <th scope="col" className={thClass}>
            {translateUi("Pesan")}
          </th>
          <th scope="col" className={cn(thClass, "text-right")}>
            {translateUi("Nominal")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <tr
            key={item.id}
            className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <td
              className={cn(
                tdClass,
                "whitespace-nowrap text-slate-600 dark:text-slate-400",
              )}
            >
              {shortDate(item.date)}
            </td>
            <td className={tdClass}>
              <span className="flex items-center gap-3">
                <DonorAvatar item={item} />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.donorName}
                </span>
              </span>
            </td>
            <td
              className={cn(
                tdClass,
                "max-w-xs text-slate-600 dark:text-slate-300",
              )}
            >
              {item.message ? `“${item.message}”` : "-"}
            </td>
            <td
              className={cn(
                tdClass,
                "whitespace-nowrap text-right font-bold tabular-nums text-green-700 dark:text-green-400",
              )}
            >
              +{formatRupiah(item.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Desktop table for uang keluar. */
function ExpenseTable({ items }: { items: TransactionListItem[] }) {
  const { t: translateUi } = useLanguage();

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 dark:bg-slate-800/50">
        <tr>
          <th scope="col" className={thClass}>
            {translateUi("Tanggal")}
          </th>
          <th scope="col" className={thClass}>
            {translateUi("Untuk")}
          </th>
          <th scope="col" className={thClass}>
            {translateUi("Ditarik oleh")}
          </th>
          <th scope="col" className={cn(thClass, "text-right")}>
            {translateUi("Nominal")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <tr
            key={item.id}
            className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <td
              className={cn(
                tdClass,
                "whitespace-nowrap text-slate-600 dark:text-slate-400",
              )}
            >
              {shortDate(item.transactionDate)}
            </td>
            <td className={cn(tdClass, "max-w-sm")}>
              <p className="font-semibold text-slate-900 dark:text-white">
                {item.title}
              </p>
              {item.category && (
                <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {item.category}
                </span>
              )}
              {item.description && (
                <p className="mt-1.5 text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              )}
              {item.proofUrl && (
                <a
                  href={item.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "mt-1 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline dark:text-blue-400",
                    focusRing,
                  )}
                >
                  <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                  {translateUi("Bukti penarikan")}
                </a>
              )}
            </td>
            <td className={tdClass}>
              <AdminBadge name={item.recordedBy?.name ?? "Pengurus"} />
            </td>
            <td
              className={cn(
                tdClass,
                "whitespace-nowrap text-right font-bold tabular-nums text-red-600 dark:text-red-400",
              )}
            >
              −{formatRupiah(item.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IncomeRow({ item }: { item: DonationIncomeItem }) {
  const { t: translateUi } = useLanguage();

  return (
    <li className="flex gap-3.5 px-5 py-4 sm:px-6">
      {item.anonymous ? (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white"
        >
          <VenetianMask className="h-5 w-5" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            toneFor(item.donorName),
          )}
        >
          {initials(item.donorName)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {item.donorName}
            {item.anonymous && (
              <span className="ml-1.5 text-xs font-normal text-slate-600 dark:text-slate-400">
                {translateUi("· identitas disembunyikan")}
              </span>
            )}
          </p>
          <p className="shrink-0 text-sm font-bold tabular-nums text-green-700 dark:text-green-400">
            +{formatRupiah(item.amount)}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
          {formatActivityTime(item.date)}
        </p>
        {item.message && (
          <p className="mt-2 rounded-xl rounded-tl-sm bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            “{item.message}”
          </p>
        )}
      </div>
    </li>
  );
}

function ExpenseRow({
  item,
  last,
}: {
  item: TransactionListItem;
  last: boolean;
}) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const date = new Date(item.transactionDate);
  const admin = item.recordedBy?.name ?? "Pengurus";
  return (
    <li className="relative flex gap-4 px-5 pt-5 sm:px-6">
      {/* timeline rail */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span className="flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white leading-none dark:border-slate-700 dark:bg-slate-900">
          <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">
            {date.toLocaleDateString(uiLocale, { day: "2-digit" })}
          </span>
          <span className="mt-0.5 text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
            {date.toLocaleDateString(uiLocale, { month: "short" })}
          </span>
        </span>
        {!last && (
          <span
            aria-hidden="true"
            className="mt-2 w-px flex-1 bg-slate-200 dark:bg-slate-800"
          />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {item.title}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {date.toLocaleDateString(uiLocale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
            −{formatRupiah(item.amount)}
          </p>
        </div>

        {(item.category || item.description) && (
          <div className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
            {item.category && (
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {translateUi("Untuk · ")}
                {item.category}
              </p>
            )}
            {item.description && (
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 py-0.5 pl-0.5 pr-3 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                toneFor(admin),
              )}
            >
              {initials(admin)}
            </span>
            {translateUi("Ditarik oleh")}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {admin}
            </strong>
          </span>
          {item.proofUrl && (
            <a
              href={item.proofUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/50",
                focusRing,
              )}
            >
              <FileText aria-hidden="true" className="h-3.5 w-3.5" />
              {translateUi("Bukti penarikan")}
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* One ledger card, switchable between uang masuk and uang keluar      */
/* ------------------------------------------------------------------ */

type Ledger = "IN" | "OUT";

function LedgerSwitch({
  value,
  onChange,
  counts,
}: {
  value: Ledger;
  onChange: (next: Ledger) => void;
  counts: Record<Ledger, number>;
}) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const options = [
    { id: "IN" as const, label: "Uang masuk", icon: ArrowDownLeft },
    { id: "OUT" as const, label: "Uang keluar", icon: ArrowUpRight },
  ];
  return (
    <div
      role="group"
      aria-label={translateUi("Tampilkan riwayat")}
      className={cn(segmentTrackClass, "w-full sm:w-auto sm:min-w-[320px]")}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={segmentButtonClass(selected, "blue")}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {translateUi(option.label)}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-bold tabular-nums",
                selected
                  ? "bg-white text-blue-800"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {counts[option.id].toLocaleString(uiLocale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function DonationSection({
  balance,
  thisMonth,
  collected,
  spent,
  incomes,
  incomePagination,
  expenses,
  expensePagination,
  footer,
}: {
  balance: number;
  thisMonth: { amount: number; count: number };
  collected: { amount: number; count: number };
  spent: { amount: number; count: number };
  incomes: DonationIncomeItem[];
  incomePagination?: ReactNode;
  expenses: TransactionListItem[];
  expensePagination?: ReactNode;
  footer?: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  const [ledger, setLedger] = useState<Ledger>("IN");
  const showIn = ledger === "IN";

  return (
    <div className="space-y-6">
      <DonationSummary balance={balance} thisMonth={thisMonth} spent={spent} />

      <section
        aria-labelledby="donation-ledger"
        className={cn(cardClass, "overflow-hidden")}
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <GradientIcon icon={Wallet} tone="blue" />
            <div>
              <h2
                id="donation-ledger"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {translateUi("Riwayat Kas Donasi")}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {showIn
                  ? translateUi("Donasi yang masuk dari warga")
                  : translateUi(
                      "Penarikan pengurus: untuk apa, kapan, oleh siapa",
                    )}
              </p>
            </div>
          </div>
          <LedgerSwitch
            value={ledger}
            onChange={setLedger}
            counts={{ IN: collected.count, OUT: spent.count }}
          />
        </div>

        {showIn ? (
          incomes.length ? (
            <>
              <div className="hidden md:block">
                <IncomeTable items={incomes} />
              </div>
              <ul className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
                {incomes.map((item) => (
                  <IncomeRow key={item.id} item={item} />
                ))}
              </ul>
            </>
          ) : (
            <EmptyLedger
              title={translateUi("Belum ada donasi masuk")}
              text="Jadilah warga pertama yang mengisi kantong donasi."
            />
          )
        ) : expenses.length ? (
          <>
            <div className="hidden md:block">
              <ExpenseTable items={expenses} />
            </div>
            <ul className="md:hidden">
              {expenses.map((item, index) => (
                <ExpenseRow
                  key={item.id}
                  item={item}
                  last={index === expenses.length - 1}
                />
              ))}
            </ul>
          </>
        ) : (
          <EmptyLedger
            title={translateUi("Belum ada penyaluran")}
            text="Saat pengurus menarik dana donasi, rinciannya langsung muncul di sini."
          />
        )}

        {(showIn ? incomePagination : expensePagination) && (
          <div className="border-t border-slate-100 px-5 pb-4 sm:px-6 dark:border-slate-800">
            {showIn ? incomePagination : expensePagination}
          </div>
        )}
      </section>

      {footer}
    </div>
  );
}
