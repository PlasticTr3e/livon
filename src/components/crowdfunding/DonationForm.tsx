"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { HandHeart, HeartHandshake } from "lucide-react";
import {
  primaryButtonClass,
  sectionCardClass,
} from "@/components/payment/payment-styles";
import {
  DONATION_DEFAULT,
  DONATION_MESSAGE_MAX,
  DONATION_PRESETS,
  getDonationAmountError,
} from "@/lib/payment/billing";
import { buildDonationCheckoutHref } from "@/lib/payment/checkout-query";
import { DonationAmountPicker } from "./DonationAmountPicker";

export function DonationForm() {
  const router = useRouter();
  const messageId = useId();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    DONATION_DEFAULT,
  );
  const [customAmount, setCustomAmount] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  const amount = customAmount || selectedPreset || 0;
  const canDonate = amount > 0 && !getDonationAmountError(amount);

  function handleSelectPreset(preset: number) {
    setSelectedPreset(preset);
    setCustomAmount(0);
  }

  function handleCustomAmountChange(value: number) {
    setCustomAmount(value);
    if (value > 0) setSelectedPreset(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canDonate) return;
    router.push(
      buildDonationCheckoutHref({ amount, anonymous: isAnonymous, message }),
    );
  }

  return (
    <form onSubmit={handleSubmit} className={sectionCardClass}>
      <div className="flex items-center gap-2">
        <HandHeart aria-hidden="true" className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Pilih jumlah donasi
        </h2>
      </div>

      <DonationAmountPicker
        presets={DONATION_PRESETS}
        selectedPreset={selectedPreset}
        customAmount={customAmount}
        onSelectPreset={handleSelectPreset}
        onCustomAmountChange={handleCustomAmountChange}
      />

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 text-sm text-slate-800 transition-colors hover:border-green-300 dark:border-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
            className="h-5 w-5 accent-green-600"
          />
          Tampilkan sebagai anonim
        </label>
        <label htmlFor={messageId} className="sr-only">
          Pesan untuk komunitas
        </label>
        <input
          id={messageId}
          value={message}
          maxLength={DONATION_MESSAGE_MAX}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Pesan untuk komunitas (opsional)"
          className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-green-500 md:text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={!canDonate}
        className={`${primaryButtonClass} mt-5 text-base`}
      >
        <HeartHandshake aria-hidden="true" className="h-5 w-5" />
        Donasi Rp {amount.toLocaleString("id-ID")}
      </button>
    </form>
  );
}
