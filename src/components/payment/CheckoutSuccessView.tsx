"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ReceiptText } from "lucide-react";
import {
  formatPaymentMethod,
  formatRupiah,
  PAYMENT_ROUTES,
} from "@/lib/payment/billing";
import {
  getOrderPeriodLabel,
  type CheckoutOrder,
  type CheckoutReceipt,
} from "./checkout-order";
import { primaryButtonClass } from "./payment-styles";
import { SummaryRows, type SummaryRow } from "./SummaryRows";

type CheckoutSuccessViewProps = {
  order: CheckoutOrder;
  receipt: CheckoutReceipt;
};

export function CheckoutSuccessView({
  order,
  receipt,
}: CheckoutSuccessViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isIpl = order.kind === "ipl";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const rows: SummaryRow[] = [
    {
      label: isIpl ? "Jumlah IPL" : "Jumlah donasi",
      value: formatRupiah(receipt.amount),
    },
    {
      label: "Metode pembayaran",
      value: formatPaymentMethod(receipt.paymentType),
    },
    isIpl
      ? { label: "Periode", value: getOrderPeriodLabel(order) }
      : { label: "Donatur", value: order.payerName },
    { label: "ID transaksi", value: receipt.orderId, breakAll: true },
    { label: "Status", value: "Berhasil", tone: "success" },
  ];

  return (
    <div className="flex min-h-full flex-col justify-center py-4 text-center md:py-8">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 text-green-600 shadow-lg dark:border-green-900 dark:bg-green-950 dark:text-green-400">
        <CheckCircle2 aria-hidden="true" className="h-9 w-9" />
      </div>
      <p className="mt-8 text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
        Transaksi selesai
      </p>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-3xl font-black text-slate-900 outline-none dark:text-white"
      >
        {isIpl ? "Pembayaran IPL berhasil" : "Donasi berhasil"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        Bukti transaksi telah tersimpan di akun Anda dan saldo kas warga sudah
        diperbarui.
      </p>

      <section className="mt-7 rounded-2xl border border-green-200 bg-white p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-extrabold text-slate-900 dark:border-slate-800 dark:text-white">
          <ReceiptText
            aria-hidden="true"
            className="h-4 w-4 text-emerald-600"
          />
          Rincian transaksi
        </h2>
        <SummaryRows rows={rows} />
      </section>

      <Link href={PAYMENT_ROUTES.hub} className={`${primaryButtonClass} mt-5`}>
        Kembali
      </Link>
    </div>
  );
}
