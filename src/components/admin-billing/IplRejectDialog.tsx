"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";

const REASON_MAX = 300;

type IplRejectDialogProps = {
  residentName: string;
  isSubmitting: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

/** Asks the admin why a payment proof is rejected before sending it back. */
export function IplRejectDialog({
  residentName,
  isSubmitting,
  onConfirm,
  onClose,
}: IplRejectDialogProps) {
  const titleId = useId();
  const reasonId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    textareaRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-5 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              Tolak pembayaran
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tagihan {residentName} kembali ke status belum bayar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <label
          htmlFor={reasonId}
          className="mt-4 block text-xs font-semibold text-gray-600 dark:text-gray-300"
        >
          Alasan penolakan
        </label>
        <textarea
          ref={textareaRef}
          id={reasonId}
          rows={3}
          maxLength={REASON_MAX}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Contoh: nominal pembayaran tidak sesuai"
          className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:ring-rose-900"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {isSubmitting && (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            )}
            Tolak
          </button>
        </div>
      </form>
    </div>
  );
}
