"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useState } from "react";
import {
  createExpenseTransaction,
  generateMonthlyBills,
  rejectResidentBill,
  verifyResidentBill,
} from "@/lib/finance/finance-api";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import { formatRupiah } from "@/lib/payment/billing";

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-base text-slate-950 dark:border-slate-600 dark:bg-slate-950 dark:text-white";
const buttonClass =
  "min-h-11 rounded-lg bg-green-800 px-4 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700";

export function FinanceManagement({
  bills,
  onSaved,
}: {
  bills: ResidentBillItem[];
  onSaved: () => Promise<void>;
}) {
  const { t: translateUi } = useLanguage();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const currentMonth = new Date().toISOString().slice(0, 7);
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      await onSaved();
      setMessage(success);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Permintaan belum berhasil.",
      );
    } finally {
      setBusy(false);
    }
  }
  function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const [year, month] = String(form.get("period")).split("-").map(Number);
    void run(async () => {
      const result = await generateMonthlyBills({
        month,
        year,
        amount: Number(form.get("amount")),
        ...(form.get("due") ? { dueDate: String(form.get("due")) } : {}),
      });
      return result;
    }, "Tagihan diterbitkan. Tagihan yang sudah ada tidak digandakan.");
  }
  function expense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(
      () =>
        createExpenseTransaction({
          title: String(form.get("title")),
          amount: Number(form.get("amount")),
          fundType: form.get("fund") as "IPL" | "DONASI",
          category: String(form.get("category")),
          description: String(form.get("description")) || null,
          proofUrl: String(form.get("proof")) || null,
        }),
      "Pengeluaran tercatat dan saldo kas diperbarui.",
    );
  }
  const pending = bills.filter((bill) => bill.status === "MENUNGGU_VERIFIKASI");
  return (
    <section aria-labelledby="management-title" className="min-w-0">
      <h2
        id="management-title"
        className="text-lg font-semibold text-slate-950 dark:text-white"
      >
        {translateUi("Pengelolaan tagihan & kas")}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {translateUi(
          "Hanya pengelola. Tagihan diterbitkan untuk warga terverifikasi.",
        )}
      </p>
      <p
        role="status"
        aria-live="polite"
        className="mt-3 text-sm text-slate-800 dark:text-slate-200"
      >
        {translateUi(message)}
      </p>
      <details className="mt-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <summary className="min-h-11 cursor-pointer py-3 font-medium text-slate-900 dark:text-white">
          {translateUi("Terbitkan tagihan IPL")}
        </summary>
        <form onSubmit={generate} className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Periode")}
            <input
              name="period"
              type="month"
              required
              defaultValue={currentMonth}
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Nominal per rumah (Rp)")}
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              defaultValue="150000"
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Jatuh tempo (opsional)")}
            <input name="due" type="date" className={inputClass} />
          </label>
          <div className="self-end">
            <button disabled={busy} className={buttonClass}>
              {busy
                ? translateUi("Menyimpan…")
                : translateUi("Terbitkan tagihan")}
            </button>
          </div>
        </form>
      </details>
      <details className="mt-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <summary className="min-h-11 cursor-pointer py-3 font-medium text-slate-900 dark:text-white">
          {translateUi("Catat pengeluaran")}
        </summary>
        <form onSubmit={expense} className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Keperluan")}
            <input
              name="title"
              required
              minLength={3}
              maxLength={255}
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Nominal (Rp)")}
            <input
              name="amount"
              type="number"
              min="1"
              step="1"
              required
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Sumber dana")}
            <select name="fund" className={inputClass}>
              <option value="IPL">{translateUi("IPL")}</option>
              <option value="DONASI">{translateUi("Donasi")}</option>
            </select>
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Kategori")}
            <input
              name="category"
              required
              maxLength={100}
              className={inputClass}
            />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Catatan (opsional)")}
            <input name="description" maxLength={1000} className={inputClass} />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-200">
            {translateUi("Tautan bukti (opsional)")}
            <input name="proof" type="url" className={inputClass} />
          </label>
          <div>
            <button disabled={busy} className={buttonClass}>
              {busy
                ? translateUi("Menyimpan…")
                : translateUi("Simpan pengeluaran")}
            </button>
          </div>
        </form>
      </details>
      <details className="mt-2">
        <summary className="min-h-11 cursor-pointer py-3 font-medium text-slate-900 dark:text-white">
          {translateUi("Tagihan warga (")}
          {bills.length}
          {translateUi(") · menunggu verifikasi (")}
          {pending.length})
        </summary>
        {!bills.length ? (
          <p className="py-3 text-sm text-slate-600 dark:text-slate-300">
            {translateUi("Belum ada tagihan yang diterbitkan.")}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {bills.map((bill) => (
              <li
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {bill.residentName || translateUi("Warga")} · {bill.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {formatRupiah(bill.amount)} ·{" "}
                    {bill.status === "LUNAS"
                      ? translateUi("Lunas")
                      : bill.status === "MENUNGGU_VERIFIKASI"
                        ? translateUi("Menunggu verifikasi")
                        : translateUi("Belum dibayar")}
                  </p>
                </div>
                {bill.status === "MENUNGGU_VERIFIKASI" && (
                  <div className="flex flex-wrap gap-3">
                    {bill.paymentProofUrl && (
                      <a
                        href={bill.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center text-sm text-green-800 underline dark:text-green-300"
                      >
                        {translateUi("Lihat bukti")}
                      </a>
                    )}
                    <button
                      disabled={busy}
                      className={buttonClass}
                      onClick={() =>
                        void run(
                          () => verifyResidentBill(bill.id),
                          "Bukti diverifikasi dan kas diperbarui.",
                        )
                      }
                    >
                      {translateUi("Verifikasi")}
                    </button>
                    <button
                      disabled={busy}
                      className="min-h-11 px-3 text-sm text-slate-700 underline dark:text-slate-200"
                      onClick={() =>
                        void run(
                          () => rejectResidentBill(bill.id),
                          "Bukti ditolak. Warga dapat mengirim ulang.",
                        )
                      }
                    >
                      {translateUi("Tolak bukti")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
