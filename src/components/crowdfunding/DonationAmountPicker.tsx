"use client";

import { useId } from "react";
import { cn } from "@/components/ui/primitives";
import {
  formatAmountInput,
  formatRupiah,
  getDonationAmountError,
  parseAmountInput,
} from "@/lib/payment/billing";

type DonationAmountPickerProps = {
  presets: number[];
  selectedPreset: number | null;
  customAmount: number;
  onSelectPreset: (amount: number) => void;
  onCustomAmountChange: (amount: number) => void;
};

export function DonationAmountPicker({
  presets,
  selectedPreset,
  customAmount,
  onSelectPreset,
  onCustomAmountChange,
}: DonationAmountPickerProps) {
  const inputId = useId();
  const errorId = useId();
  const error = getDonationAmountError(customAmount);

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Nominal donasi"
        className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4"
      >
        {presets.map((preset) => {
          const isSelected = selectedPreset === preset && customAmount === 0;

          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectPreset(preset)}
              className={cn(
                "h-14 rounded-xl border-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                isSelected
                  ? "border-green-600 bg-green-600 text-white shadow-sm"
                  : "border-slate-200 text-slate-700 hover:border-green-400 hover:bg-green-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-green-950/40",
              )}
            >
              {formatRupiah(preset)}
            </button>
          );
        })}
      </div>

      <label
        htmlFor={inputId}
        className="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400"
      >
        Jumlah lainnya
      </label>
      <div
        className={cn(
          "mt-2 flex h-14 items-center rounded-xl border-2 bg-slate-50 px-4 transition-colors dark:bg-slate-950",
          error
            ? "border-rose-300 focus-within:border-rose-500 dark:border-rose-800"
            : "border-slate-200 focus-within:border-green-500 dark:border-slate-700",
        )}
      >
        <span aria-hidden="true" className="font-bold text-slate-400">
          Rp
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="Masukkan nominal"
          value={formatAmountInput(customAmount)}
          onChange={(event) =>
            onCustomAmountChange(parseAmountInput(event.target.value))
          }
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-lg font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
        />
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
