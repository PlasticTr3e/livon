"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleDollarSign, Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/shared/AppToaster";
import { createExpenseTransaction } from "@/lib/finance/finance-api";
import { formatAmountInput, parseAmountInput } from "@/lib/payment/billing";
import type { ApiFundType } from "@/lib/payment/finance-data";
import { AdminFormCard } from "./AdminFormCard";
import {
  adminFieldClass,
  adminLabelClass,
  adminSubmitClass,
} from "./admin-billing-styles";

const FUND_OPTIONS: { value: ApiFundType; label: string }[] = [
  { value: "IPL", label: "Dana IPL" },
  { value: "DONASI", label: "Dana Donasi" },
];

const CATEGORIES = [
  "Keamanan",
  "Kebersihan",
  "Fasilitas",
  "Operasional",
  "Bantuan sosial",
  "Dana darurat",
  "Lainnya",
];

const TITLE_MIN = 3;

function getTodayInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

type ExpenseReportFormProps = {
  onSaved: () => void;
};

/** Records an expense; the API deducts it from the chosen fund balance. */
export function ExpenseReportForm({ onSaved }: ExpenseReportFormProps) {
  const toast = useToast();
  const id = useId();
  const [fundType, setFundType] = useState<ApiFundType>("IPL");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(getTodayInput);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    title.trim().length >= TITLE_MIN && amount > 0 && !isSubmitting;

  function resetForm() {
    setTitle("");
    setAmount(0);
    setNote("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await createExpenseTransaction({
        title: title.trim(),
        amount,
        fundType,
        category,
        description: note.trim() || null,
        transactionDate: date ? new Date(`${date}T12:00:00`) : undefined,
      });
      toast.success(
        "Pengeluaran disimpan",
        "Saldo kas diperbarui dan tampil di transparansi warga.",
      );
      resetForm();
      onSaved();
    } catch (error) {
      toast.error(
        "Gagal menyimpan pengeluaran",
        error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminFormCard
      icon={Plus}
      title="Input Laporan Pengeluaran"
      description="Pengeluaran baru langsung mengurangi saldo dan tampil pada transparansi warga."
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-fund`} className={adminLabelClass}>
              Sumber dana
            </label>
            <select
              id={`${id}-fund`}
              value={fundType}
              onChange={(event) =>
                setFundType(event.target.value as ApiFundType)
              }
              className={adminFieldClass}
            >
              {FUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-category`} className={adminLabelClass}>
              Kategori
            </label>
            <select
              id={`${id}-category`}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={adminFieldClass}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-title`} className={adminLabelClass}>
            Nama pengeluaran
          </label>
          <input
            id={`${id}-title`}
            value={title}
            maxLength={255}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Honor petugas keamanan"
            className={adminFieldClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-amount`} className={adminLabelClass}>
              Nominal
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                Rp
              </span>
              <input
                id={`${id}-amount`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={formatAmountInput(amount)}
                onChange={(event) =>
                  setAmount(parseAmountInput(event.target.value))
                }
                className={`${adminFieldClass} pl-10 font-semibold tabular-nums`}
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${id}-date`} className={adminLabelClass}>
              Tanggal
            </label>
            <input
              id={`${id}-date`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={adminFieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor={`${id}-note`} className={adminLabelClass}>
            Catatan
          </label>
          <input
            id={`${id}-note`}
            value={note}
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Keterangan tambahan (opsional)"
            className={adminFieldClass}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`${adminSubmitClass} mt-auto`}
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <CircleDollarSign aria-hidden="true" className="h-4 w-4" />
          )}
          {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
        </button>
      </form>
    </AdminFormCard>
  );
}
