"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { primaryButtonClass } from "@/components/payment/payment-styles";
import {
  DONATION_DEFAULT,
  DONATION_MESSAGE_MAX,
  DONATION_PRESETS,
  getDonationAmountError,
} from "@/lib/payment/billing";
import { buildDonationCheckoutHref } from "@/lib/payment/checkout-query";
import { DonationAmountPicker } from "./DonationAmountPicker";

export function DonationForm() {
  const { t: translateUi } = useLanguage();

  const router = useRouter();
  const messageId = useId();
  const [amount, setAmount] = useQueryState(
    "jumlah",
    parseAsInteger.withDefault(DONATION_DEFAULT),
  );
  const [mode, setMode] = useQueryState(
    "nominal",
    parseAsString.withDefault("preset"),
  );
  const [anonymous, setAnonymous] = useQueryState(
    "anonim",
    parseAsString.withDefault("0"),
  );
  const [message, setMessage] = useQueryState(
    "pesan",
    parseAsString.withDefault(""),
  );
  const selectedPreset =
    mode === "preset" && DONATION_PRESETS.includes(amount) ? amount : null;
  const canDonate = amount > 0 && !getDonationAmountError(amount);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canDonate)
          router.push(
            buildDonationCheckoutHref({
              amount,
              anonymous: anonymous === "1",
              message,
            }),
          );
      }}
    >
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        {translateUi("Pilih nominal")}
      </h2>
      <DonationAmountPicker
        presets={DONATION_PRESETS}
        selectedPreset={selectedPreset}
        customAmount={selectedPreset ? 0 : amount}
        onSelectPreset={(value) => {
          void setMode("preset");
          void setAmount(value);
        }}
        onCustomAmountChange={(value) => {
          void setMode("custom");
          void setAmount(value);
        }}
      />
      <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-slate-800 dark:text-slate-200">
        <input
          type="checkbox"
          checked={anonymous === "1"}
          onChange={(event) =>
            void setAnonymous(event.target.checked ? "1" : "0")
          }
          className="h-5 w-5 accent-green-800"
        />
        {translateUi("Tampilkan sebagai anonim")}
      </label>
      <label
        htmlFor={messageId}
        className="mt-4 block text-sm text-slate-700 dark:text-slate-200"
      >
        {translateUi("Pesan untuk komunitas (opsional)")}
      </label>
      <textarea
        id={messageId}
        rows={3}
        value={message}
        maxLength={DONATION_MESSAGE_MAX}
        onChange={(event) => void setMessage(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-400 bg-white p-3 text-base text-slate-950 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
      />
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
        {message.length}/{DONATION_MESSAGE_MAX} {translateUi(" karakter")}
      </p>
      <button
        type="submit"
        disabled={!canDonate}
        className={`${primaryButtonClass} mt-6`}
      >
        {translateUi("Tinjau donasi")}
      </button>
    </form>
  );
}
