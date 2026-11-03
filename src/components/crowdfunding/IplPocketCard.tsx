import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, LogIn, Settings2 } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import {
  outlineButtonClass,
  primaryButtonClass,
} from "@/components/payment/payment-styles";
import { formatRupiah, PAYMENT_ROUTES } from "@/lib/payment/billing";
import type { IplStatus, IplStatusKind } from "./ipl-status";

const ADMIN_BILLING_HREF = "/admin/crowdfunding";

type IplPocketCardProps = {
  status: IplStatus;
  isLoading?: boolean;
};

const BADGES: Record<IplStatusKind, { label: string; className: string }> = {
  unpaid: {
    label: "Belum dibayar",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  },
  awaiting: {
    label: "Menunggu verifikasi",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  },
  paid: {
    label: "Sudah dibayar",
    className: "bg-green-900 text-white dark:bg-green-800",
  },
  none: {
    label: "Belum terbit",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  guest: {
    label: "Perlu masuk",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  admin: {
    label: "Mode admin",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  "not-warga": {
    label: "Khusus warga",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
};

function getDescription(status: IplStatus) {
  const period =
    status.billCount > 1 ? `${status.billCount} bulan` : status.periodLabel;
  return period
    ? `Iuran ${period} untuk keamanan, kebersihan, perawatan fasilitas, dan operasional lingkungan.`
    : "Iuran bulanan untuk keamanan, kebersihan, perawatan fasilitas, dan operasional lingkungan.";
}

function getAmountCaption(kind: IplStatusKind) {
  if (kind === "unpaid") return "Total tagihan";
  if (kind === "awaiting") return "Sedang diverifikasi";
  if (kind === "paid") return "Tagihan terakhir";
  return "Tagihan otomatis";
}

function DisabledAction({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      className={cn(
        primaryButtonClass,
        "disabled:bg-green-300 disabled:text-white dark:disabled:bg-green-900/60 dark:disabled:text-green-200",
      )}
    >
      {children}
    </button>
  );
}

function IplAction({ status }: { status: IplStatus }) {
  switch (status.kind) {
    case "unpaid":
      return (
        <Link href={PAYMENT_ROUTES.iplCheckout} className={primaryButtonClass}>
          Bayar IPL {formatRupiah(status.amount)}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      );
    case "guest":
      return (
        <Link href="/auth/login" className={outlineButtonClass}>
          <LogIn aria-hidden="true" className="h-4 w-4" />
          Masuk untuk melihat tagihan
        </Link>
      );
    case "admin":
      return (
        <Link href={ADMIN_BILLING_HREF} className={outlineButtonClass}>
          <Settings2 aria-hidden="true" className="h-4 w-4" />
          Kelola tagihan IPL
        </Link>
      );
    case "awaiting":
      return <DisabledAction>Menunggu verifikasi pengurus</DisabledAction>;
    case "paid":
      return (
        <DisabledAction>
          Pembayaran selesai
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </DisabledAction>
      );
    case "none":
      return <DisabledAction>Belum ada tagihan</DisabledAction>;
    default:
      return <DisabledAction>Khusus akun warga</DisabledAction>;
  }
}

export function IplPocketCard({
  status,
  isLoading = false,
}: IplPocketCardProps) {
  const badge = BADGES[status.kind];
  const hasAmount = status.amount > 0;

  return (
    <article
      aria-busy={isLoading}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm sm:p-8 dark:border-green-900/60 dark:from-green-950/40 dark:to-slate-900"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full border-[32px] border-green-100/80 dark:border-green-900/30"
      />

      <div className="relative flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700 dark:text-green-400">
          Kewajiban bulanan
        </p>
        <Building2
          aria-hidden="true"
          className="h-7 w-7 text-green-700 dark:text-green-400"
        />
      </div>

      <h2 className="relative mt-5 text-xl font-black tracking-tight text-slate-900 dark:text-white">
        Kantong pembayaran IPL
      </h2>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {getDescription(status)}
      </p>

      <div className="relative mt-6 flex items-end justify-between gap-3 border-y border-green-100 py-5 dark:border-slate-800">
        {isLoading ? (
          <>
            <span className="h-14 w-40 animate-pulse rounded-lg bg-green-100 dark:bg-slate-800" />
            <span className="h-6 w-24 animate-pulse rounded-full bg-green-100 dark:bg-slate-800" />
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {getAmountCaption(status.kind)}
              </p>
              <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl text-slate-900 dark:text-white">
                {hasAmount ? formatRupiah(status.amount) : "—"}
              </p>
            </div>
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </>
        )}
      </div>

      <div className="relative mt-auto pt-6">
        {isLoading ? (
          <span className="block h-14 animate-pulse rounded-xl bg-green-100 dark:bg-slate-800" />
        ) : (
          <IplAction status={status} />
        )}
      </div>
    </article>
  );
}
