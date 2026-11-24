"use client";

import { useId, useState, type FormEvent } from "react";
import { CalendarPlus, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/shared/AppToaster";
import { notifyIplBillsIssued } from "@/app/(admin)/admin/crowdfunding/actions";
import { generateMonthlyBills } from "@/lib/finance/finance-api";
import { getStoredPaymentToken } from "@/lib/payment/payment-api";
import {
  formatAmountInput,
  formatBillingPeriod,
  formatRupiah,
  parseAmountInput,
  toBillingPeriod,
} from "@/lib/payment/billing";
import { AdminFormCard } from "./AdminFormCard";
import {
  adminFieldClass,
  adminLabelClass,
  adminSubmitClass,
} from "./admin-billing-styles";

const MIN_IPL_AMOUNT = 1_000;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function getMonthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
  });
}

type IplBillGenerateFormProps = {
  onGenerated: () => void;
};

/** Issues one IPL bill per verified warga for the chosen month. */
export function IplBillGenerateForm({ onGenerated }: IplBillGenerateFormProps) {
  const toast = useToast();
  const id = useId();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = `Iuran IPL ${formatBillingPeriod(
    toBillingPeriod(new Date(year, month - 1, 1)),
  )}`;
  const amountError =
    amount > 0 && amount < MIN_IPL_AMOUNT
      ? `Minimal ${formatRupiah(MIN_IPL_AMOUNT)}`
      : null;
  const canSubmit = amount >= MIN_IPL_AMOUNT && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const result = await generateMonthlyBills({
        month,
        year,
        amount,
        title,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:00`) : undefined,
      });
      const notification = await notifyIplBillsIssued(getStoredPaymentToken(), {
        month,
        year,
      });

      if (result.generatedCount > 0) {
        toast.success(
          "Tagihan diterbitkan",
          notification.ok
            ? `${result.message} ${notification.notified} warga menerima notifikasi.`
            : result.message,
        );
      } else {
        toast.info("Tidak ada tagihan baru", result.message);
      }
      if (!notification.ok) {
        toast.error("Notifikasi belum terkirim", notification.error);
      }
      onGenerated();
    } catch (error) {
      toast.error(
        "Gagal menerbitkan tagihan",
        error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminFormCard
      icon={CalendarPlus}
      title="Terbitkan Tagihan IPL"
      description="Tagihan dibuat untuk semua warga terverifikasi. Warga yang sudah punya tagihan di periode ini dilewati."
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-month`} className={adminLabelClass}>
              Bulan
            </label>
            <select
              id={`${id}-month`}
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className={adminFieldClass}
            >
              {MONTHS.map((value) => (
                <option key={value} value={value}>
                  {getMonthName(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-year`} className={adminLabelClass}>
              Tahun
            </label>
            <input
              id={`${id}-year`}
              type="number"
              inputMode="numeric"
              min={2020}
              max={2100}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className={adminFieldClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-amount`} className={adminLabelClass}>
              Nominal per rumah
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                Rp
              </span>
              <input
                id={`${id}-amount`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="150.000"
                value={formatAmountInput(amount)}
                onChange={(event) =>
                  setAmount(parseAmountInput(event.target.value))
                }
                aria-invalid={Boolean(amountError)}
                aria-describedby={
                  amountError ? `${id}-amount-error` : undefined
                }
                className={`${adminFieldClass} pl-10 font-semibold tabular-nums`}
              />
            </div>
            {amountError && (
              <p
                id={`${id}-amount-error`}
                className="mt-1 text-xs text-rose-600 dark:text-rose-400"
              >
                {amountError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${id}-due`} className={adminLabelClass}>
              Jatuh tempo
            </label>
            <input
              id={`${id}-due`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={adminFieldClass}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Kosongkan untuk tanggal 15.
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-green-50 px-3 py-2.5 text-xs text-gray-600 dark:bg-green-950/30 dark:text-gray-300">
          Judul tagihan:{" "}
          <strong className="text-gray-900 dark:text-white">{title}</strong>
        </p>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${adminSubmitClass} mt-auto`}
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="h-4 w-4" />
          )}
          {isSubmitting ? "Menerbitkan..." : "Terbitkan Tagihan"}
        </button>
      </form>
    </AdminFormCard>
  );
}
