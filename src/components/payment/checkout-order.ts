import { formatBillingPeriods, type CheckoutKind } from "@/lib/payment/billing";
import type { DonationCheckoutDetails } from "@/lib/payment/checkout-query";
import { ANONYMOUS_DONOR, type IplBill } from "@/lib/payment/finance-data";

/** Everything the checkout screens need to describe one payment. */
export type CheckoutOrder = {
  kind: CheckoutKind;
  amount: number;
  payerName: string;
  /** IPL only: the unpaid bills being settled, oldest first. */
  bills?: IplBill[];
  residenceLabel?: string | null;
  donation?: DonationCheckoutDetails;
};

export type CheckoutReceipt = {
  orderId: string;
  amount: number;
  redirectUrl: string;
  paymentType?: string;
};

export function buildIplOrder(
  bills: IplBill[],
  userName: string,
  residenceLabel: string | null,
): CheckoutOrder {
  return {
    kind: "ipl",
    amount: bills.reduce((total, bill) => total + Math.round(bill.amount), 0),
    payerName: userName,
    bills,
    residenceLabel,
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
  return formatBillingPeriods((order.bills ?? []).map((bill) => bill.period));
}
