"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ReceiptText, RotateCw } from "lucide-react";
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
import { PaymentNotice } from "./PaymentNotice";
import { outlineButtonClass, primaryButtonClass } from "./payment-styles";
import { SummaryRows, type SummaryRow } from "./SummaryRows";

/** Progress of writing the settled payment to the finance API. */
export type RecordStatus = "saving" | "saved" | "error";

type CheckoutSuccessViewProps = {
  order: CheckoutOrder;
  receipt: CheckoutReceipt;
  recordStatus: RecordStatus;
  onRetryRecord: () => void;
};

function getStatusRow(isIpl: boolean, recordStatus: RecordStatus): SummaryRow {
  if (recordStatus === "saving") {
    return { label: "Status", value: "Mencatat..." };
  }
  if (recordStatus === "error") {
    return { label: "Status", value: "Dibayar, belum tercatat" };
  }
  return isIpl
    ? { label: "Status", value: "Menunggu verifikasi" }
    : { label: "Status", value: "Berhasil", tone: "success" };
}

export function CheckoutSuccessView({
  order,
  receipt,
  recordStatus,
  onRetryRecord,
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
    getStatusRow(isIpl, recordStatus),
  ];

  const description = isIpl
    ? "Pembayaran diterima Midtrans. Pengurus akan memverifikasi agar tagihan Anda berstatus lunas."
    : "Terima kasih! Donasi Anda masuk ke kas solidaritas warga.";

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
        className="mt-2 text-2xl font-black text-slate-900 outline-none sm:text-3xl dark:text-white"
      >
        {isIpl ? "Pembayaran IPL berhasil" : "Donasi berhasil"}
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
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

      <div aria-live="polite">
        {recordStatus === "error" && (
          <div className="mt-5 space-y-3">
            <PaymentNotice icon={RotateCw}>
              Pembayaran sukses, tetapi gagal dicatat ke buku kas. Coba catat
              ulang agar saldo terbarui.
            </PaymentNotice>
            <button
              type="button"
              onClick={onRetryRecord}
              className={outlineButtonClass}
            >
              <RotateCw aria-hidden="true" className="h-4 w-4" />
              Catat ulang transaksi
            </button>
          </div>
        )}
      </div>

      <Link
        href={PAYMENT_ROUTES.hub}
        aria-disabled={recordStatus === "saving"}
        className={`${primaryButtonClass} mt-5 aria-disabled:pointer-events-none aria-disabled:opacity-60`}
      >
        {recordStatus === "saving" ? "Mencatat transaksi..." : "Kembali"}
      </Link>
    </div>
  );
}
