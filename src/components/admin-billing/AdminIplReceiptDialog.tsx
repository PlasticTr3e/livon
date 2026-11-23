"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useState } from "react";
import { Leaf, Printer } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { fetchIplReceipt } from "@/lib/admin-billing/admin-billing-api";
import {
  bankLabel,
  dateTime,
  methodLabel,
  rupiah,
  shortDate,
} from "@/lib/admin-billing/admin-billing-format";
import type { IplReceipt } from "@/lib/admin-billing/admin-billing-types";
import {
  AdminDialog,
  ErrorBlock,
  LoadingBlock,
  primaryButtonClass,
  secondaryButtonClass,
} from "./AdminBillingUi";

function Field({ label, value }: { label: string; value: string }) {
  const { t: translateUi } = useLanguage();

  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {translateUi(label)}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900 break-words">
        {value}
      </dd>
    </div>
  );
}

/** The printable nota. Kept light-themed on purpose: it is what gets printed. */
function Receipt({ receipt }: { receipt: IplReceipt }) {
  const { t: translateUi, locale: uiLocale } = useLanguage();

  const isDemo =
    receipt.method === "demo" || receipt.title.startsWith("[DEMO]");
  const paid = receipt.status === "LUNAS";
  return (
    <article className="print-area relative bg-white p-6 text-gray-900 sm:p-8">
      <header className="flex items-start justify-between gap-4 border-b-2 border-green-700 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white">
            <Leaf aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-black tracking-wide text-green-800">
              {translateUi("LIVON")}
            </p>
            <p className="text-xs text-gray-600">
              {translateUi("Iuran Pengelolaan Lingkungan")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-black">
            {translateUi("NOTA PEMBAYARAN")}
          </p>
          <p className="mt-0.5 font-mono text-xs text-gray-600">
            {receipt.receiptNumber}
          </p>
        </div>
      </header>

      {isDemo && (
        <p className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-900">
          {translateUi(
            "DATA DEMO: nota ini dibuat dari data contoh, bukan pembayaran nyata.",
          )}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <Field label={translateUi("Diterima dari")} value={receipt.name} />
        <Field label={translateUi("Rumah")} value={receipt.house || "-"} />
        <Field label={translateUi("Email")} value={receipt.email} />
        <Field label={translateUi("Periode")} value={receipt.period} />
        <Field
          label={translateUi("Jatuh tempo")}
          value={shortDate(receipt.dueDate)}
        />
        <Field
          label={translateUi("Tanggal bayar")}
          value={dateTime(receipt.paidAt)}
        />
      </dl>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-y border-gray-200 text-left text-[11px] uppercase tracking-wide text-gray-500">
            <th scope="col" className="py-2 font-semibold">
              {translateUi("Rincian")}
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              {translateUi("Nominal")}
            </th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={item.label} className="border-b border-gray-100">
              <td className="py-2.5">{item.label}</td>
              <td className="py-2.5 text-right tabular-nums">
                {rupiah(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-3 text-left text-base font-black">
              {translateUi("Total")}
            </th>
            <td className="pt-3 text-right text-base font-black tabular-nums">
              {rupiah(receipt.amount)}
            </td>
          </tr>
        </tfoot>
      </table>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
        <Field
          label={translateUi("Metode")}
          value={methodLabel(receipt.method)}
        />
        <Field
          label={translateUi("Bank / penerbit")}
          value={bankLabel(receipt.bank)}
        />
        <Field
          label={translateUi("Sumber")}
          value={
            receipt.source === "ONLINE"
              ? "Pembayaran online"
              : "Verifikasi manual"
          }
        />
        <Field
          label={translateUi("ID transaksi")}
          value={receipt.gatewayTransactionId ?? "-"}
        />
        <Field label={translateUi("ID order")} value={receipt.orderId ?? "-"} />
        <Field
          label={translateUi("Status")}
          value={paid ? "Lunas" : "Belum lunas"}
        />
      </dl>

      {paid && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-36 -rotate-12 rounded-lg border-4 border-green-600/70 px-4 py-1 text-2xl font-black tracking-widest text-green-600/70"
        >
          {translateUi("LUNAS")}
        </span>
      )}

      <footer className="mt-6 border-t border-dashed border-gray-300 pt-3 text-[11px] leading-5 text-gray-500">
        {translateUi(
          "Nota ini dibuat otomatis oleh sistem LIVON dan sah tanpa tanda tangan. Dicetak ",
        )}
        {new Date().toLocaleString(uiLocale)}.
      </footer>
    </article>
  );
}

export function AdminIplReceiptDialog({
  billId,
  onClose,
}: {
  billId: string;
  onClose: () => void;
}) {
  const { t: translateUi } = useLanguage();

  const [receipt, setReceipt] = useState<IplReceipt | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetchIplReceipt(billId)
      .then((data) => active && setReceipt(data))
      .catch(
        (cause: Error) =>
          active && setError(cause.message || "Nota belum dapat dimuat."),
      );
    return () => {
      active = false;
    };
  }, [billId, attempt]);

  return (
    <AdminDialog
      title={translateUi("Detail pembayaran")}
      description={receipt ? `${receipt.name} · ${receipt.period}` : undefined}
      onClose={onClose}
      size="lg"
      className="print-dialog"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            {translateUi("Tutup")}
          </button>
          <button
            type="button"
            disabled={!receipt}
            onClick={() => window.print()}
            className={cn(primaryButtonClass)}
          >
            <Printer aria-hidden="true" className="h-4 w-4" />
            {translateUi("Cetak nota")}
          </button>
        </>
      }
    >
      {receipt ? (
        <Receipt receipt={receipt} />
      ) : error ? (
        <ErrorBlock
          message={error}
          onRetry={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}
        />
      ) : (
        <LoadingBlock label={translateUi("Memuat nota…")} />
      )}
    </AdminDialog>
  );
}
