import {
  getFinanceTransactions,
  payResidentBill,
  recordDonation,
} from "@/lib/finance/finance-api";
import { formatPaymentMethod } from "@/lib/payment/billing";
import { buildDonationNote } from "@/lib/payment/finance-data";
import type { CheckoutOrder, CheckoutReceipt } from "./checkout-order";

/**
 * Writes a settled Midtrans payment to the finance API:
 * - IPL: each bill gets the Snap receipt as payment proof and moves to
 *   `MENUNGGU_VERIFIKASI`; the admin's verification credits the IPL fund.
 * - Donation: recorded once (keyed by order id) into the DONASI fund.
 */
export async function recordCheckoutPayment(
  order: CheckoutOrder,
  receipt: CheckoutReceipt,
) {
  if (order.kind === "ipl") {
    const notes = `Lunas via Midtrans (${formatPaymentMethod(receipt.paymentType)}) · Order ${receipt.orderId}`;
    await Promise.all(
      (order.bills ?? []).map((bill) =>
        payResidentBill(bill.id, {
          paymentProofUrl: receipt.redirectUrl,
          notes,
        }),
      ),
    );
    return;
  }

  const existing = await getFinanceTransactions({
    fundType: "DONASI",
    type: "PEMASUKAN",
    search: receipt.orderId,
    limit: 1,
  });
  if (existing.pagination.total > 0) return;

  const anonymous = order.donation?.anonymous ?? false;
  await recordDonation({
    amount: receipt.amount,
    donorName: anonymous ? null : order.payerName,
    isAnonymous: anonymous,
    description: buildDonationNote(
      order.donation?.message ?? "",
      receipt.orderId,
    ),
    proofUrl: receipt.redirectUrl,
  });
}
