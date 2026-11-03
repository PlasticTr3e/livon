import {
  formatBillingPeriods,
  IPL_MONTHLY_FEE,
  type BillingPeriod,
  type CheckoutKind,
} from "@/lib/payment/billing";
import type { DonationCheckoutDetails } from "@/lib/payment/checkout-query";
import { ANONYMOUS_DONOR } from "@/lib/payment/finance-store";

/** Everything the checkout screens need to describe one payment. */
export type CheckoutOrder = {
  kind: CheckoutKind;
  amount: number;
  payerName: string;
  periods?: BillingPeriod[];
  donation?: DonationCheckoutDetails;
};

export type CheckoutReceipt = {
  orderId: string;
  amount: number;
  paymentType?: string;
};

export function buildIplOrder(
  periods: BillingPeriod[],
  userName: string,
): CheckoutOrder {
  return {
    kind: "ipl",
    amount: periods.length * IPL_MONTHLY_FEE,
    payerName: userName,
    periods,
  };
}

export function buildDonationOrder(
  donation: DonationCheckoutDetails,
  userName: string,
): CheckoutOrder {
  return {
    kind: "donation",
    amount: donation.amount,
    payerName: donation.anonymous ? ANONYMOUS_DONOR : userName,
    donation,
  };
}

export function getOrderPeriodLabel(order: CheckoutOrder) {
  return formatBillingPeriods(order.periods ?? []);
}
