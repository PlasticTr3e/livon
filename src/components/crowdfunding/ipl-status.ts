import { formatBillingPeriods } from "@/lib/payment/billing";
import type { IplBill } from "@/lib/payment/finance-data";

export type IplStatusKind =
  | "guest"
  | "admin"
  | "not-warga"
  | "none"
  | "unpaid"
  | "awaiting"
  | "paid";

export type IplStatus = {
  kind: IplStatusKind;
  /** Amount due (unpaid), being verified (awaiting) or last paid (paid). */
  amount: number;
  periodLabel: string | null;
  billCount: number;
};

type IplStatusInput = {
  isAuthenticated: boolean;
  isWarga: boolean;
  isAdmin: boolean;
  unpaidBills: IplBill[];
  awaitingBills: IplBill[];
  latestBill: IplBill | null;
};

function summarize(kind: IplStatusKind, bills: IplBill[]): IplStatus {
  return {
    kind,
    amount: bills.reduce((total, bill) => total + bill.amount, 0),
    periodLabel: bills.length
      ? formatBillingPeriods(bills.map((bill) => bill.period))
      : null,
    billCount: bills.length,
  };
}

/** Unpaid bills win over pending verification, which wins over paid. */
export function getIplStatus(input: IplStatusInput): IplStatus {
  if (!input.isAuthenticated) return summarize("guest", []);
  if (input.isAdmin) return summarize("admin", []);
  if (!input.isWarga) return summarize("not-warga", []);
  if (input.unpaidBills.length > 0) {
    return summarize("unpaid", input.unpaidBills);
  }
  if (input.awaitingBills.length > 0) {
    return summarize("awaiting", input.awaitingBills);
  }
  if (input.latestBill) return summarize("paid", [input.latestBill]);
  return summarize("none", []);
}
