import { cn } from "@/components/ui/primitives";
import type { BillStatus } from "@/lib/finance/finance-types";

export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  BELUM_BAYAR: "Belum bayar",
  MENUNGGU_VERIFIKASI: "Menunggu verifikasi",
  LUNAS: "Lunas",
};

const STATUS_STYLE: Record<BillStatus, string> = {
  BELUM_BAYAR:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  MENUNGGU_VERIFIKASI:
    "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  LUNAS: "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300",
};

export function IplBillStatusBadge({ status }: { status: BillStatus }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {BILL_STATUS_LABEL[status]}
    </span>
  );
}
