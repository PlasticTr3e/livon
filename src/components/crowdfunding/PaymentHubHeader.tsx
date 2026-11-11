import { Wallet } from "lucide-react";

export function PaymentHubHeader() {
  return (
    <div className="bg-transparent">
      <div className="mx-auto max-w-6xl px-4 pb-2 pt-6 sm:px-5 md:pb-4 md:pt-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md">
            <Wallet aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl dark:text-white">
              Pembayaran &amp; dana warga
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Bayar IPL, berdonasi, dan pantau penggunaan dana lingkungan secara
              transparan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
