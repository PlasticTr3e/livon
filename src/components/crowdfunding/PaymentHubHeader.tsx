import { ShieldCheck, Wallet } from "lucide-react";

export function PaymentHubHeader() {
  return (
    <div className="bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-6 sm:px-5 md:pb-9 md:pt-10">
        <div className="flex items-start gap-3 sm:gap-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-md sm:h-14 sm:w-14">
            <Wallet aria-hidden="true" className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
              Pembayaran &amp; dana warga
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
              Bayar IPL, berdonasi, dan pantau penggunaan dana lingkungan secara
              transparan.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700 sm:text-sm dark:text-green-400">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Data kas diperbarui otomatis
            </p>
          </div>
        </div>
        <div className="mt-6 h-0.5 rounded-full bg-green-200 md:mt-8 dark:bg-green-900/60" />
      </div>
    </div>
  );
}
