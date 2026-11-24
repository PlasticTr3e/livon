import { HandHeart, Landmark } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { getOrderPeriodLabel, type CheckoutOrder } from "./checkout-order";
import { greenPanelClass } from "./payment-styles";

function getSubtitle(order: CheckoutOrder) {
  if (order.kind === "ipl") {
    return [`IPL periode ${getOrderPeriodLabel(order)}`, order.residenceLabel]
      .filter(Boolean)
      .join(" · ");
  }
  return order.donation?.anonymous
    ? "Ditampilkan sebagai donatur anonim"
    : null;
}

export function CheckoutAmountCard({ order }: { order: CheckoutOrder }) {
  const isIpl = order.kind === "ipl";
  const Icon = isIpl ? Landmark : HandHeart;
  const subtitle = getSubtitle(order);

  return (
    <section className={cn(greenPanelClass, "p-6")}>
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
        <Icon aria-hidden="true" className="h-4 w-4" />
        Ringkasan {isIpl ? "pembayaran" : "donasi"}
      </h2>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="text-sm text-white/50">Rp</span>
        <strong className="text-3xl tracking-[-0.04em] tabular-nums">
          {order.amount.toLocaleString("id-ID")}
        </strong>
      </p>
      {subtitle && (
        <p className="mt-2 text-xs text-emerald-100/70">{subtitle}</p>
      )}
    </section>
  );
}
