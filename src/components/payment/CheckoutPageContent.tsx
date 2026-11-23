"use client";
import { getDisplayLocale, translateDisplay } from "@/lib/i18n/display";

import { useLanguage } from "@/context/LanguageContext";

import { BillBreakdown } from "@/components/crowdfunding/BillBreakdown";
import Link from "next/link";
import { HandCoins, ReceiptText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentPageShell } from "./PaymentPageShell";
import { PaymentFlowHeader } from "./PaymentFlowHeader";
import { FeatureCard } from "@/components/shared/FeatureCard";
import {
  useFinanceHub,
  financeRequest,
} from "@/components/crowdfunding/useFinanceHub";
import { FinanceLoadState } from "@/components/crowdfunding/FinanceLoadState";
import {
  formatRupiah,
  formatShortDate,
  PAYMENT_ROUTES,
  type CheckoutKind,
} from "@/lib/payment/billing";
import {
  PAYMENT_STATE_LABELS,
  type PaymentRecord,
  type CreatePaymentInput,
} from "@/lib/payment/finance-types";
import type { DonationCheckoutDetails } from "@/lib/payment/checkout-query";
import { buildDonationCheckoutHref } from "@/lib/payment/checkout-query";
import { primaryButtonClass, outlineButtonClass } from "./payment-styles";

type Props = {
  kind: CheckoutKind;
  donation: DonationCheckoutDetails | null;
  billId?: string;
  orderId?: string;
};
function saveReceipt(order: PaymentRecord) {
  const receipt = [
    translateDisplay("Bukti pembayaran Livon"),
    order.title,
    "ID: " + order.id,
    translateDisplay("Nominal") + ": " + formatRupiah(order.amount),
    translateDisplay("Status") +
      ": " +
      translateDisplay(PAYMENT_STATE_LABELS[order.status]),
    translateDisplay("Dibayar") +
      ": " +
      (order.paidAt
        ? new Date(order.paidAt).toLocaleString(getDisplayLocale())
        : "-"),
    translateDisplay("Metode") + ": " + (order.paymentType || "-"),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([receipt], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = order.id + ".txt";
  link.click();
  URL.revokeObjectURL(url);
}
export function CheckoutPageContent({
  kind,
  donation,
  billId,
  orderId,
}: Props) {
  const { t: translateUi, locale: uiLocale, language } = useLanguage();

  const router = useRouter();
  const { data, error: loadError, refresh } = useFinanceHub(billId);
  const [order, setOrder] = useState<PaymentRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const paidHeading = useRef<HTMLHeadingElement>(null);
  const bill =
    data?.selectedBill ??
    data?.bills.find((item) => item.id === (order?.billId ?? billId));
  const amount =
    order?.amount ?? (kind === "ipl" ? bill?.amount : donation?.amount);
  // "Menu awal" = halaman Billing & Care, langsung ke tab yang relevan.
  const menuHref = `${PAYMENT_ROUTES.hub}#${kind === "ipl" ? "ipl" : "donasi"}`;
  // Ubah donasi hanya selama belum ada order; selain itu kembali ke menu awal.
  const backToMenu = Boolean(orderId) || kind === "ipl" || !donation;
  const backHref =
    kind === "donation" && donation
      ? buildDonationCheckoutHref(donation).replace(
          PAYMENT_ROUTES.donationCheckout,
          PAYMENT_ROUTES.donationDetail,
        )
      : PAYMENT_ROUTES.hub;

  const checkStatus = useCallback(async (id: string) => {
    try {
      const next = await financeRequest<PaymentRecord>(
        `/api/finance/payments/${encodeURIComponent(id)}`,
      );
      setOrder(next);
      setError(next.warning || "");
      return next;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Status belum dapat diperiksa.",
      );
      return null;
    }
  }, []);
  useEffect(() => {
    if (!orderId) return;
    const timer = window.setTimeout(() => void checkStatus(orderId), 0);
    return () => window.clearTimeout(timer);
  }, [orderId, checkStatus]);
  useEffect(() => {
    if (!orderId || (order && !["PENDING", "CREATING"].includes(order.status)))
      return;
    const timer = window.setInterval(() => void checkStatus(orderId), 5000);
    return () => window.clearInterval(timer);
  }, [orderId, order, checkStatus]);
  useEffect(() => {
    if (order?.status === "PAID") {
      paidHeading.current?.focus();
      window.dispatchEvent(new Event("livon:notifications-changed"));
    }
  }, [order?.status]);

  function openPayment(next: PaymentRecord) {
    if (!next.snapToken || !window.snap?.pay) {
      setError(
        "Halaman pembayaran belum siap. Coba tombol lanjutkan beberapa saat lagi.",
      );
      return;
    }
    window.snap.pay(next.snapToken, {
      language,
      onSuccess: () => void checkStatus(next.id),
      onPending: () => void checkStatus(next.id),
      onError: () => void checkStatus(next.id),
      onClose: () => void checkStatus(next.id),
    });
  }
  async function pay() {
    setBusy(true);
    setError("");
    try {
      if (order) {
        openPayment(order);
        return;
      }
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const input: CreatePaymentInput =
        kind === "ipl"
          ? { kind, billId: billId || "", requestId: requestId.current }
          : {
              kind,
              amount: donation?.amount || 0,
              anonymous: donation?.anonymous || false,
              message: donation?.message || "",
              requestId: requestId.current,
            };
      const next = await financeRequest<PaymentRecord>(
        "/api/finance/payments",
        input,
      );
      setOrder(next);
      router.replace(
        `/payment/${kind === "ipl" ? "ipl" : "donasi"}?order=${next.id}`,
      );
      if (next.status === "PENDING") openPayment(next);
    } catch (cause) {
      requestId.current = null;
      setError(
        cause instanceof Error
          ? cause.message
          : "Pembayaran belum dapat dibuat.",
      );
    } finally {
      setBusy(false);
    }
  }
  const final = order && !["PENDING", "CREATING"].includes(order.status);
  return (
    <PaymentPageShell
      width="narrow"
      header={
        <PaymentFlowHeader
          title={
            order?.status === "PAID"
              ? translateUi("Pembayaran berhasil")
              : order
                ? translateUi(PAYMENT_STATE_LABELS[order.status])
                : kind === "ipl"
                  ? translateUi("Bayar tagihan IPL")
                  : translateUi("Konfirmasi donasi")
          }
          description={translateUi(
            "Periksa rincian dan ikuti status pembayaran Anda.",
          )}
          icon={kind === "ipl" ? ReceiptText : HandCoins}
          backHref={backToMenu ? menuHref : backHref}
          backLabel={
            backToMenu
              ? translateUi("Kembali ke menu awal")
              : translateUi("Kembali ke donasi")
          }
          headingRef={paidHeading}
        />
      }
    >
      <FeatureCard>
        {!data && !order ? (
          <FinanceLoadState
            error={loadError || error}
            retry={() => {
              void refresh();
              if (orderId) void checkStatus(orderId);
            }}
          />
        ) : orderId && !order ? (
          <FinanceLoadState
            error={error}
            retry={() => void checkStatus(orderId)}
          />
        ) : !amount ? (
          <p className="mt-5 text-sm text-slate-700 dark:text-slate-200">
            {translateUi(
              "Tagihan atau nominal tidak ditemukan. Kembali untuk memilih tagihan atau donasi.",
            )}
          </p>
        ) : (
          <>
            <dl className="divide-y divide-slate-200 border-b border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
                <dt className="text-slate-600 dark:text-slate-300">
                  {translateUi("Nominal")}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">
                  {formatRupiah(amount)}
                </dd>
              </div>
              {bill && (
                <div className="py-4">
                  <dt className="text-sm text-slate-600 dark:text-slate-300">
                    {bill.title}
                    {data?.residence ? " · " + data.residence : ""}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-white">
                    {bill.month}/{bill.year}
                    {bill.dueDate
                      ? " · Jatuh tempo " + formatShortDate(bill.dueDate)
                      : ""}
                  </dd>
                </div>
              )}
              {bill && kind === "ipl" && (
                <div className="py-4">
                  <BillBreakdown bill={bill} />
                </div>
              )}
              {order && (
                <>
                  <div className="py-4">
                    <dt className="text-sm text-slate-600 dark:text-slate-300">
                      {translateUi("ID transaksi")}
                    </dt>
                    <dd className="mt-1 break-all text-sm text-slate-900 dark:text-white">
                      {order.id}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-4">
                    <dt className="text-sm text-slate-600 dark:text-slate-300">
                      {translateUi("Status")}
                    </dt>
                    <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">
                      {translateUi(PAYMENT_STATE_LABELS[order.status])}
                    </dd>
                  </div>
                  {order.paidAt && (
                    <div className="py-4 text-sm text-slate-700 dark:text-slate-200">
                      {translateUi("Diterima ")}
                      {new Date(order.paidAt).toLocaleString(uiLocale)}
                    </div>
                  )}
                </>
              )}
            </dl>
            {!order && (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {translateUi(
                  "Periksa nominal sebelum melanjutkan. Pilihan metode pembayaran tersedia di Midtrans.",
                )}
              </p>
            )}
            {order?.status === "PENDING" && (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {translateUi(
                  "Transaksi tersimpan di riwayat Anda. Berlaku sampai",
                )}{" "}
                {new Date(order.expiresAt).toLocaleString(uiLocale)}
                {translateUi(
                  ". Status diperiksa otomatis saat halaman ini terbuka.",
                )}
              </p>
            )}
            {order?.status === "PAID" && (
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {translateUi(
                  "Pembayaran sudah dicatat di akun dan kas lingkungan. Bukti ini bisa dibuka kembali dari riwayat pembayaran.",
                )}
              </p>
            )}
            {order?.status === "REVIEW" && (
              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {translateUi(
                  "Dana diterima, tetapi tagihan terkait sudah lunas. Hubungi pengelola dengan ID transaksi ini untuk pemeriksaan.",
                )}
              </p>
            )}
            <p
              role="status"
              aria-live="polite"
              className="mt-4 text-sm text-red-800 dark:text-red-300"
            >
              {translateUi(error)}
            </p>
            {!final && (
              <button
                type="button"
                disabled={
                  busy ||
                  order?.status === "CREATING" ||
                  (!order && kind === "ipl" && bill?.status !== "BELUM_BAYAR")
                }
                onClick={() => void pay()}
                className={`${primaryButtonClass} mt-4`}
              >
                {busy
                  ? translateUi("Menyiapkan pembayaran…")
                  : order
                    ? translateUi("Lanjutkan pembayaran")
                    : translateUi("Lanjut ke pembayaran")}
              </button>
            )}
            {order && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await checkStatus(order.id);
                  setBusy(false);
                }}
                className={`${outlineButtonClass} mt-3`}
              >
                {busy
                  ? translateUi("Memeriksa…")
                  : translateUi("Periksa status")}
              </button>
            )}
            {order?.status === "PAID" && (
              <button
                type="button"
                onClick={() => saveReceipt(order)}
                className={`${outlineButtonClass} mt-3`}
              >
                {translateUi("Unduh bukti pembayaran")}
              </button>
            )}
            {final && (
              <Link href={menuHref} className={`${outlineButtonClass} mt-3`}>
                {translateUi("Kembali ke menu awal")}
              </Link>
            )}
          </>
        )}
      </FeatureCard>
    </PaymentPageShell>
  );
}
