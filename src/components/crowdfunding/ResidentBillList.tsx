"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import {
  formatRupiah,
  formatShortDate,
  PAYMENT_ROUTES,
} from "@/lib/payment/billing";

const statuses = {
  LUNAS: "Lunas",
  BELUM_BAYAR: "Belum dibayar",
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
};
export function ResidentBillList({
  bills,
  residence,
  total,
  outstanding,
}: {
  bills: ResidentBillItem[];
  residence: string;
  total: number;
  outstanding: { amount: number; count: number };
}) {
  const { t: translateUi } = useLanguage();

  return (
    <section aria-labelledby="my-bills" className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h2
            id="my-bills"
            className="text-lg font-semibold text-slate-950 dark:text-white"
          >
            {translateUi("Tagihan saya")}
            {residence ? ` · ${residence}` : ""}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {outstanding.count
              ? translateUi(
                  "{0} tagihan belum lunas, termasuk yang menunggu verifikasi.",
                  { 0: outstanding.count },
                )
              : bills.length
                ? translateUi("Tidak ada tagihan yang perlu dibayar saat ini.")
                : translateUi(
                    "Pengelola belum menerbitkan tagihan untuk akun Anda.",
                  )}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {translateUi("Total belum lunas")}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-green-800 dark:text-green-300">
            {formatRupiah(outstanding.amount)}
          </p>
        </div>
      </div>
      {bills.length > 0 && (
        <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
          {bills.map((bill) => (
            <li
              key={bill.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-white">
                  {bill.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {String(bill.month).padStart(2, "0")}/{bill.year}
                  {bill.dueDate
                    ? translateUi(" · Jatuh tempo {0}", {
                        0: formatShortDate(bill.dueDate),
                      })
                    : ""}
                </p>
                {bill.notes && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {bill.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-slate-950 dark:text-white">
                    {formatRupiah(bill.amount)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {statuses[bill.status]}
                  </p>
                </div>
                {bill.status === "BELUM_BAYAR" && (
                  <Link
                    href={`${PAYMENT_ROUTES.iplCheckout}?bill=${bill.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700"
                  >
                    {translateUi("Bayar tagihan")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {total > bills.length && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {translateUi("Menampilkan ")}
          {bills.length} {translateUi(" dari ")}
          {total} {translateUi(" tagihan terbaru.")}
        </p>
      )}
    </section>
  );
}
