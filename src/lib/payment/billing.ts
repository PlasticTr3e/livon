/** Billing rules shared by the IPL & donation pages and the Snap server action. */

export type CheckoutKind = "ipl" | "donation";

/** Billing period in `YYYY-MM` form. */
export type BillingPeriod = string;

export const IPL_MONTHLY_FEE = 150_000;
export const IPL_MAX_MONTHS = 12;
export const IPL_RESIDENCE_LABEL = "Cluster Arunika A-12";

export const DONATION_PRESETS = [25_000, 50_000, 100_000, 250_000];
export const DONATION_DEFAULT = 100_000;
export const DONATION_MIN = 10_000;
export const DONATION_MAX = 50_000_000;
export const DONATION_MESSAGE_MAX = 140;

/** URL slugs used by `/crowdfunding/[id]` and `/payment/[id]`. */
export const CHECKOUT_SLUG: Record<CheckoutKind, string> = {
  ipl: "ipl",
  donation: "donasi",
};

export const PAYMENT_ROUTES = {
  hub: "/crowdfunding",
  donationDetail: `/crowdfunding/${CHECKOUT_SLUG.donation}`,
  iplCheckout: `/payment/${CHECKOUT_SLUG.ipl}`,
  donationCheckout: `/payment/${CHECKOUT_SLUG.donation}`,
} as const;

export function getCheckoutKindFromSlug(slug: string): CheckoutKind | null {
  if (slug === CHECKOUT_SLUG.ipl) return "ipl";
  if (slug === CHECKOUT_SLUG.donation) return "donation";
  return null;
}

export function isBillingPeriod(value: string): value is BillingPeriod {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function toBillingPeriod(date: Date): BillingPeriod {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftBillingPeriod(
  period: BillingPeriod,
  months: number,
): BillingPeriod {
  const [year, month] = period.split("-").map(Number);
  return toBillingPeriod(new Date(year, month - 1 + months, 1));
}

/** Months after `paidThrough` up to and including the current month. */
export function getOutstandingPeriods(
  paidThrough: BillingPeriod,
  now = new Date(),
): BillingPeriod[] {
  const current = toBillingPeriod(now);
  const periods: BillingPeriod[] = [];
  let next = shiftBillingPeriod(paidThrough, 1);

  while (next <= current && periods.length < IPL_MAX_MONTHS) {
    periods.push(next);
    next = shiftBillingPeriod(next, 1);
  }

  return periods;
}

export function formatBillingPeriod(period: BillingPeriod) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

export function formatBillingPeriods(periods: BillingPeriod[]) {
  if (periods.length === 0) return "-";
  if (periods.length === 1) return formatBillingPeriod(periods[0]);
  return `${formatBillingPeriod(periods[0])} – ${formatBillingPeriod(periods[periods.length - 1])}`;
}

/** Month name only, e.g. "November". */
export function formatBillingMonth(period: BillingPeriod) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
  });
}

export function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

/** Short form for stat tiles, e.g. `Rp 35,25 jt`. */
export function formatCompactRupiah(amount: number) {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`;
  }
  return formatRupiah(amount);
}

/** `05 Mar 2026` */
export function formatShortDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `Hari ini, 09.42` / `Kemarin, 18.15` / `18 Mar 2026` */
export function formatActivityTime(date: Date | string, now = new Date()) {
  const target = new Date(date);
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(target)) / 86_400_000,
  );
  const time = target.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) return `Hari ini, ${time}`;
  if (diffDays === 1) return `Kemarin, ${time}`;
  return formatShortDate(target);
}

/** Keeps digits only so `"100.000"` and `"100000"` both parse to 100000. */
export function parseAmountInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return digits ? Number(digits) : 0;
}

export function formatAmountInput(amount: number) {
  return amount > 0 ? amount.toLocaleString("id-ID") : "";
}

export function getDonationAmountError(amount: number) {
  if (amount === 0) return null;
  if (amount < DONATION_MIN) {
    return `Minimal donasi ${formatRupiah(DONATION_MIN)}`;
  }
  if (amount > DONATION_MAX) {
    return `Maksimal donasi ${formatRupiah(DONATION_MAX)}`;
  }
  return null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virtual Account",
  echannel: "Mandiri Bill Payment",
  qris: "QRIS",
  gopay: "GoPay",
  shopeepay: "ShopeePay",
  credit_card: "Kartu Kredit",
  cstore: "Gerai Retail",
};

export function formatPaymentMethod(paymentType?: string) {
  if (!paymentType) return "Midtrans";
  return PAYMENT_METHOD_LABELS[paymentType] ?? paymentType.replace(/_/g, " ");
}
