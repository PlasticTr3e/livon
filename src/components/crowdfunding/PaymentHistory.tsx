"use client";

import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import type { ReactNode } from "react";
import { CircleCheck, Clock3, History, XCircle } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  PAYMENT_STATE_LABELS,
  type PaymentRecord,
} from "@/lib/payment/finance-types";
import { formatRupiah, formatShortDate } from "@/lib/payment/billing";
import { CardHeader, cardClass, CountBadge, focusRing } from "./billing-ui";

const PENDING = ["PENDING", "CREATING"];

function statusTone(status: PaymentRecord["status"]) {
  if (status === "PAID")
    return {
      icon: CircleCheck,
      tile: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-300",
    };
  if (PENDING.includes(status) || status === "REVIEW")
    return {
      icon: Clock3,
      tile: "bg-yellow-50 text-yellow-800 ring-yellow-600/30 dark:bg-yellow-950 dark:text-yellow-300",
    };
  return {
    icon: XCircle,
    tile: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
  };
}

export function PaymentHistory({
  orders,
  total,
  title = "Riwayat Pembayaran Saya",
  emptyText = "Pembayaran iuran dan donasi Anda akan muncul di sini. Anda juga bisa melanjutkan pembayaran yang belum selesai dari bagian ini.",
  footer,
}: {
  orders: PaymentRecord[];
  total?: number;
  title?: string;
  emptyText?: string;
  footer?: ReactNode;
}) {
  const { t: translateUi } = useLanguage();

  return (
    <section
      aria-labelledby="payment-history"
      className={cn(cardClass, "overflow-hidden")}
    >
      <CardHeader
        id="payment-history"
        icon={History}
        title={title}
        caption={translateUi(
          "Lanjutkan pembayaran yang belum selesai dari sini",
        )}
        aside={total ? <CountBadge value={total} /> : undefined}
      />
      {!orders.length ? (
        <div className="px-5 py-8 text-center sm:px-6">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {translateUi("Belum ada pembayaran")}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-400">
            {translateUi(emptyText)}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {orders.map((order) => {
            const tone = statusTone(order.status);
            const Icon = tone.icon;
            const pending = PENDING.includes(order.status);
            return (
              <li
                key={order.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-50 sm:px-6 dark:hover:bg-slate-800/40"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                    tone.tile,
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {order.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    {formatShortDate(order.createdAt)} ·{" "}
                    {translateUi(PAYMENT_STATE_LABELS[order.status])}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatRupiah(order.amount)}
                  </span>
                  <Link
                    href={`/payment/${order.kind === "ipl" ? "ipl" : "donasi"}?order=${order.id}`}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-lg px-3.5 text-xs font-bold transition-colors duration-200",
                      pending
                        ? "bg-gradient-to-r from-green-700 to-green-800 text-white shadow-sm hover:from-green-800 hover:to-green-900"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
                      focusRing,
                    )}
                  >
                    {pending
                      ? translateUi("Lanjutkan")
                      : translateUi("Rincian")}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {footer && (
        <div className="border-t border-slate-100 px-5 pb-4 sm:px-6 dark:border-slate-800">
          {footer}
        </div>
      )}
    </section>
  );
}
