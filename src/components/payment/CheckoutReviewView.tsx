import Link from "next/link";
import { CheckCircle2, Clock3, LogIn, RefreshCw } from "lucide-react";
import { CheckoutAmountCard } from "./CheckoutAmountCard";
import type { CheckoutOrder } from "./checkout-order";
import { PaymentBreakdownCard } from "./PaymentBreakdownCard";
import { PaymentNotice } from "./PaymentNotice";
import { outlineButtonClass, primaryButtonClass } from "./payment-styles";
import type { SnapPendingOrder } from "./useSnapCheckout";

type CheckoutReviewViewProps = {
  order: CheckoutOrder;
  countdownLabel: string;
  isExpired: boolean;
  isStarting: boolean;
  needsLogin: boolean;
  pendingOrder: SnapPendingOrder | null;
  isChecking: boolean;
  onConfirm: () => void;
  onResume: () => void;
  onCheckStatus: () => void;
  onCancelPending: () => void;
};

export function CheckoutReviewView({
  order,
  countdownLabel,
  isExpired,
  isStarting,
  needsLogin,
  pendingOrder,
  isChecking,
  onConfirm,
  onResume,
  onCheckStatus,
  onCancelPending,
}: CheckoutReviewViewProps) {
  const isIpl = order.kind === "ipl";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
          Konfirmasi pembayaran
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          {isIpl ? "Selesaikan pembayaran IPL" : "Selesaikan donasi Anda"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Periksa kembali rincian sebelum mengonfirmasi.
        </p>
      </div>

      <CheckoutAmountCard order={order} />
      <PaymentBreakdownCard order={order} />

      {needsLogin && (
        <PaymentNotice icon={LogIn}>
          Anda belum masuk.{" "}
          <Link
            href="/auth/login"
            className="font-bold underline underline-offset-2"
          >
            Masuk dulu
          </Link>{" "}
          untuk melanjutkan.
        </PaymentNotice>
      )}

      {pendingOrder ? (
        <div role="status" aria-live="polite" className="space-y-3">
          <PaymentNotice icon={RefreshCw} tone="info">
            Menunggu pembayaran di Midtrans. Status diperiksa otomatis.
          </PaymentNotice>
          <button
            type="button"
            onClick={onResume}
            className={primaryButtonClass}
          >
            Lanjutkan pembayaran
          </button>
          <button
            type="button"
            onClick={onCheckStatus}
            disabled={isChecking}
            className={outlineButtonClass}
          >
            {isChecking
              ? "Memeriksa status..."
              : "Saya sudah bayar, cek status"}
          </button>
          <button
            type="button"
            onClick={onCancelPending}
            className="min-h-11 w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Batalkan dan ubah rincian
          </button>
        </div>
      ) : (
        <>
          <PaymentNotice icon={Clock3}>
            {isExpired ? (
              "Waktu pembayaran habis. Muat ulang halaman untuk mencoba lagi."
            ) : (
              <>
                Selesaikan pembayaran dalam{" "}
                <strong className="font-mono">{countdownLabel}</strong>
              </>
            )}
          </PaymentNotice>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isStarting || isExpired || needsLogin}
            aria-busy={isStarting}
            className={primaryButtonClass}
          >
            {isStarting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                Konfirmasi pembayaran
              </>
            )}
          </button>
        </>
      )}

      <p className="text-center text-[11px] leading-5 text-slate-400">
        Dengan melanjutkan, Anda menyetujui pencatatan transaksi pada buku kas
        LIVON. Pembayaran diproses oleh Midtrans.
      </p>
    </div>
  );
}
