"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useId } from "react";
import { cn } from "@/components/ui/primitives";
import {
  formatAmountInput,
  formatRupiah,
  getDonationAmountError,
  parseAmountInput,
} from "@/lib/payment/billing";
type Props = {
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
}: Props) {
  const { t: translateUi } = useLanguage();

  const id = useId();
  const error = getDonationAmountError(customAmount);
  return (
    <div>
      <fieldset className="mt-4 grid grid-cols-2 gap-3">
        <legend className="sr-only">
          {translateUi("Pilihan nominal donasi")}
        </legend>
        {presets.map((preset) => (
          <label
            key={preset}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green-700",
              selectedPreset === preset && !customAmount
                ? "border-green-800 bg-green-800 text-white"
                : "border-slate-400 text-slate-800 dark:border-slate-600 dark:text-slate-200",
            )}
          >
            <input
              type="radio"
              name={id + "-preset"}
              checked={selectedPreset === preset && !customAmount}
              onChange={() => onSelectPreset(preset)}
              className="h-4 w-4 accent-green-800"
            />
            {formatRupiah(preset)}
          </label>
        ))}
      </fieldset>
      <label
        htmlFor={id}
        className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {translateUi("Nominal lainnya (Rp)")}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={translateUi("Masukkan nominal")}
        value={formatAmountInput(customAmount)}
        onChange={(event) =>
          onCustomAmountChange(parseAmountInput(event.target.value))
        }
        aria-invalid={Boolean(error)}
        aria-describedby={error ? id + "-error" : undefined}
        className="mt-2 min-h-12 w-full rounded-lg border border-slate-400 bg-white px-3 text-base tabular-nums text-slate-950 placeholder:text-slate-600 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
      />
      {error && (
        <p
          id={id + "-error"}
          role="status"
          className="mt-2 text-sm text-red-800 dark:text-red-300"
        >
          {translateUi(error)}
        </p>
      )}
    </div>
  );
}
