import { cn } from "@/components/ui/primitives";
import {
  formatBillingPeriod,
  formatRupiah,
  IPL_MONTHLY_FEE,
} from "@/lib/payment/billing";
import type { CheckoutOrder } from "./checkout-order";
import { sectionCardClass } from "./payment-styles";
import { SummaryRows, type SummaryRow } from "./SummaryRows";

export function PaymentBreakdownCard({ order }: { order: CheckoutOrder }) {
  const periods = order.periods ?? [];
  const itemRows: SummaryRow[] =
    order.kind === "ipl"
      ? periods.map((period) => ({
          label:
            periods.length > 1
              ? `IPL ${formatBillingPeriod(period)}`
              : "Tagihan IPL",
          value: formatRupiah(IPL_MONTHLY_FEE),
        }))
      : [{ label: "Jumlah donasi", value: formatRupiah(order.amount) }];
  const message = order.donation?.message;

  return (
    <section className={cn(sectionCardClass, "md:p-5")}>
      <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
        Rincian pembayaran
      </h2>
      <SummaryRows
        className="mt-4"
        rows={[
          ...itemRows,
          { label: "Biaya admin", value: "Gratis", tone: "success" },
        ]}
        total={{ label: "Total pembayaran", value: formatRupiah(order.amount) }}
      />
      {message && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="block text-xs font-bold text-slate-400">
            Pesan untuk komunitas
          </span>
          {message}
        </p>
      )}
    </section>
  );
}
