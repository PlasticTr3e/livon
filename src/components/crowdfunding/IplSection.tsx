"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CircleCheck,
  Clock3,
  Headset,
  Hourglass,
  House,
  MessageCircle,
  Phone,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import {
  formatRupiah,
  formatShortDate,
  PAYMENT_ROUTES,
} from "@/lib/payment/billing";
import { IPL_CS, iplWhatsappLink } from "@/lib/payment/ipl-contact";
import { BillBreakdown } from "./BillBreakdown";
import {
  BalanceCard,
  BalanceFact,
  balanceActionClass,
  CardHeader,
  cardClass,
  CountBadge,
  focusRing,
  type Tone,
} from "./billing-ui";
import {
  formatLongDate,
  formatPeriod,
  getBillState,
  getDaysUntilDue,
  getIplOverview,
  type IplBillState,
} from "./ipl-status";

export const BILL_STATE_META: Record<
  IplBillState,
  { label: string; pill: string; dot: string; icon: typeof CircleCheck }
> = {
  LUNAS: {
    label: "Lunas",
    pill: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-300 dark:ring-green-400/20",
    dot: "bg-green-500",
    icon: CircleCheck,
  },
  BELUM_BAYAR: {
    label: "Belum dibayar",
    pill: "bg-yellow-50 text-yellow-800 ring-yellow-600/30 dark:bg-yellow-950 dark:text-yellow-300 dark:ring-yellow-400/20",
    dot: "bg-yellow-500",
    icon: Clock3,
  },
  TERLAMBAT: {
    label: "Lewat jatuh tempo",
    pill: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/20",
    dot: "bg-red-500",
    icon: AlertTriangle,
  },
  MENUNGGU: {
    label: "Menunggu verifikasi",
    pill: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/20",
    dot: "bg-blue-500",
    icon: Hourglass,
  },
};

export function BillStatePill({ state }: { state: IplBillState }) {
  const { t: translateUi } = useLanguage();

  const meta = BILL_STATE_META[state];
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

function countdown(dueDate: string) {
  const days = getDaysUntilDue(dueDate);
  if (days > 1) return `${days} hari lagi`;
  if (days === 1) return "Besok";
  if (days === 0) return "Hari ini";
  return `Terlambat ${Math.abs(days)} hari`;
}

const STATE_TONE: Record<IplBillState, Tone> = {
  BELUM_BAYAR: "yellow",
  LUNAS: "green",
  MENUNGGU: "blue",
  TERLAMBAT: "red",
};

/* ------------------------------------------------------------------ */
/* Detail card (right column)                                          */
/* ------------------------------------------------------------------ */

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof House;
  label: string;
  children: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {translateUi(label)}
        </dt>
        <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
          {children}
        </dd>
      </div>
    </div>
  );
}

function BillDetails({
  bill,
  state,
  residence,
}: {
  bill: ResidentBillItem;
  state: IplBillState;
  residence: string;
}) {
  const { t: translateUi } = useLanguage();

  const days = bill.dueDate ? getDaysUntilDue(bill.dueDate) : null;
  return (
    <section
      aria-labelledby="ipl-detail"
      className={cn(cardClass, "flex flex-col")}
    >
      <CardHeader
        id="ipl-detail"
        icon={ReceiptText}
        title={translateUi("Rincian Tagihan")}
        caption={translateUi("IPL {0}", { 0: formatPeriod(bill) })}
        aside={<BillStatePill state={state} />}
      />
      <BillBreakdown
        bill={bill}
        className="border-b border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800"
      />
      <dl className="divide-y divide-slate-100 px-5 sm:px-6 dark:divide-slate-800">
        {residence && (
          <DetailRow icon={House} label={translateUi("Rumah")}>
            {residence}
          </DetailRow>
        )}
        <DetailRow icon={CalendarClock} label={translateUi("Jatuh tempo")}>
          <span className="flex flex-wrap items-center gap-2">
            {bill.dueDate
              ? formatLongDate(bill.dueDate)
              : translateUi("Tidak ditentukan")}
            {bill.dueDate &&
              days !== null &&
              (state === "BELUM_BAYAR" || state === "TERLAMBAT") && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-bold",
                    state === "TERLAMBAT"
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : days <= 3
                        ? "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  )}
                >
                  {countdown(bill.dueDate)}
                </span>
              )}
          </span>
        </DetailRow>
        {state === "LUNAS" && bill.paidAt && (
          <DetailRow icon={CircleCheck} label={translateUi("Dibayar")}>
            {formatLongDate(bill.paidAt)}
          </DetailRow>
        )}
      </dl>
      <p className="mt-auto flex items-start gap-2 border-t border-slate-100 px-5 py-4 text-xs leading-5 text-slate-600 sm:px-6 dark:border-slate-800 dark:text-slate-400">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-700 dark:text-green-400"
        />
        {state === "MENUNGGU"
          ? translateUi(
              "Pembayaran sudah diterima. Status berubah menjadi lunas setelah diverifikasi pengelola.",
            )
          : state === "LUNAS"
            ? translateUi(
                "Tagihan bulan berikutnya muncul di sini begitu diterbitkan developer.",
              )
            : translateUi(
                "IPL dikelola developer perumahan. Pembayaran online diproses lewat Midtrans.",
              )}
      </p>
    </section>
  );
}

function ContactCsCard({ bill }: { bill: ResidentBillItem }) {
  const { t: translateUi } = useLanguage();

  const whatsapp = iplWhatsappLink(
    `Halo ${IPL_CS.name}, saya ingin menyelesaikan tagihan IPL ${formatPeriod(bill)} sebesar ${formatRupiah(bill.amount)} yang sudah lewat jatuh tempo.`,
  );
  return (
    <section
      aria-labelledby="ipl-cs"
      className={cn(
        cardClass,
        "flex flex-col border-red-200 dark:border-red-900/60",
      )}
    >
      <CardHeader
        id="ipl-cs"
        icon={Headset}
        tone="red"
        title={translateUi("Wajib Hubungi Customer Service")}
        caption={translateUi("Tagihan lewat jatuh tempo")}
      />
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
          {translateUi(
            "IPL dikelola oleh developer perumahan. Tagihan yang sudah lewat jatuh tempo tidak bisa dibayar online dan harus diselesaikan melalui",
          )}{" "}
          <strong className="font-semibold text-slate-900 dark:text-white">
            {IPL_CS.name}
          </strong>
          .
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
          <div>
            <dt className="text-xs text-slate-600 dark:text-slate-400">
              {translateUi("Periode")}
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-900 dark:text-white">
              {formatPeriod(bill)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600 dark:text-slate-400">
              {translateUi("Jatuh tempo")}
            </dt>
            <dd className="mt-0.5 font-semibold text-red-700 dark:text-red-400">
              {bill.dueDate ? formatShortDate(bill.dueDate) : "-"}
            </dd>
          </div>
        </dl>
        <BillBreakdown bill={bill} className="mt-4" />
        <div className="mt-auto grid gap-2 pt-5">
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:from-red-700 hover:to-red-800",
                focusRing,
              )}
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              {translateUi("Chat CS via WhatsApp")}
            </a>
          )}
          {IPL_CS.phone && (
            <a
              href={`tel:${IPL_CS.phone}`}
              className={cn(
                "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                focusRing,
              )}
            >
              <Phone aria-hidden="true" className="h-4 w-4" />
              {translateUi("Telepon ")}
              {IPL_CS.phone}
            </a>
          )}
          {!whatsapp && !IPL_CS.phone && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {translateUi(
                "Silakan datang ke kantor pemasaran / pengelola perumahan.",
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Summary: balance card + details                                     */
/* ------------------------------------------------------------------ */

function IplSummary({
  bills,
  outstanding,
  payable,
  residence,
}: {
  bills: ResidentBillItem[];
  outstanding: { amount: number; count: number };
  payable: { amount: number; count: number };
  residence: string;
}) {
  const { t: translateUi } = useLanguage();

  const { state, focus } = getIplOverview(bills);

  if (state === "KOSONG" || !focus) {
    return (
      <article
        className={cn(
          cardClass,
          "flex flex-col items-center px-6 py-14 text-center",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md">
          <Building2 aria-hidden="true" className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
          {translateUi("Belum Ada Tagihan IPL")}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">
          {translateUi(
            "Tagihan bulanan akan muncul di sini setelah diterbitkan oleh developer perumahan.",
          )}
        </p>
      </article>
    );
  }

  const tone = STATE_TONE[state];
  const waiting = {
    amount: outstanding.amount - payable.amount,
    count: outstanding.count - payable.count,
  };
  // Only bills the resident still has to pay count toward the headline amount.
  const amount =
    state === "LUNAS"
      ? 0
      : state === "MENUNGGU"
        ? waiting.amount
        : payable.amount;
  const amountLabel = {
    BELUM_BAYAR: "Total yang harus dibayar",
    TERLAMBAT: "Total yang harus dibayar",
    MENUNGGU: "Sedang diverifikasi",
    LUNAS: "Sisa tagihan",
  }[state];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
      <BalanceCard
        tone={tone}
        icon={Building2}
        label={translateUi("Pembayaran IPL")}
        status={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                BILL_STATE_META[state].dot,
              )}
            />
            {state === "LUNAS"
              ? translateUi("Lunas")
              : BILL_STATE_META[state].label}
          </span>
        }
        amountLabel={amountLabel}
        amount={formatRupiah(amount)}
        meta={
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <BalanceFact
              icon={ReceiptText}
              label={translateUi("Periode")}
              value={formatPeriod(focus)}
            />
            {state === "LUNAS" && focus.paidAt ? (
              <BalanceFact
                icon={CircleCheck}
                label={translateUi("Dibayar")}
                value={formatShortDate(focus.paidAt)}
              />
            ) : (
              <BalanceFact
                icon={CalendarClock}
                label={translateUi("Jatuh tempo")}
                value={focus.dueDate ? formatShortDate(focus.dueDate) : "-"}
              />
            )}
          </dl>
        }
        action={
          state === "BELUM_BAYAR" ? (
            <Link
              href={`${PAYMENT_ROUTES.iplCheckout}?bill=${focus.id}`}
              className={balanceActionClass("yellow")}
            >
              {translateUi("Bayar sekarang")}
            </Link>
          ) : state === "TERLAMBAT" ? (
            <a href="#ipl-cs" className={balanceActionClass("red")}>
              <Headset aria-hidden="true" className="h-4 w-4" />
              {translateUi("Hubungi CS")}
            </a>
          ) : null
        }
      />
      {state === "TERLAMBAT" ? (
        <ContactCsCard bill={focus} />
      ) : (
        <BillDetails bill={focus} state={state} residence={residence} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bill history                                                        */
/* ------------------------------------------------------------------ */

function IplBillHistory({
  bills,
  total,
  children,
}: {
  bills: ResidentBillItem[];
  total: number;
  children?: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  if (!bills.length) return null;
  return (
    <section
      aria-labelledby="ipl-bills"
      className={cn(cardClass, "overflow-hidden")}
    >
      <CardHeader
        id="ipl-bills"
        icon={CalendarClock}
        title={translateUi("Riwayat Tagihan")}
        caption={translateUi("Semua tagihan IPL untuk rumah Anda")}
        aside={<CountBadge value={total} />}
      />
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {bills.map((bill) => {
          const state = getBillState(bill);
          const meta = BILL_STATE_META[state];
          const Icon = meta.icon;
          return (
            <li
              key={bill.id}
              className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-50 sm:px-6 dark:hover:bg-slate-800/40"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                  meta.pill,
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatPeriod(bill)}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {state === "LUNAS" && bill.paidAt
                    ? translateUi("Dibayar {0}", {
                        0: formatShortDate(bill.paidAt),
                      })
                    : bill.dueDate
                      ? translateUi("Jatuh tempo {0}", {
                          0: formatShortDate(bill.dueDate),
                        })
                      : translateUi("Tanpa jatuh tempo")}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatRupiah(bill.amount)}
                </span>
                <BillStatePill state={state} />
              </div>
            </li>
          );
        })}
      </ul>
      {children && (
        <div className="border-t border-slate-100 px-5 pb-4 sm:px-6 dark:border-slate-800">
          {children}
        </div>
      )}
    </section>
  );
}

export function IplSection({
  bills,
  summaryBills,
  total,
  outstanding,
  payable,
  residence,
  pagination,
  footer,
}: {
  bills: ResidentBillItem[];
  /** Unpaid + latest bills for the summary card, independent of the history page. */
  summaryBills: ResidentBillItem[];
  total: number;
  outstanding: { amount: number; count: number };
  payable: { amount: number; count: number };
  residence: string;
  pagination?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <IplSummary
        bills={summaryBills}
        outstanding={outstanding}
        payable={payable}
        residence={residence}
      />
      <IplBillHistory bills={bills} total={total}>
        {pagination}
      </IplBillHistory>
      {footer}
    </div>
  );
}
