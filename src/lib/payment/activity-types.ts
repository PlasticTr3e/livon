import type { CheckoutKind } from "./billing";
export type FundType = CheckoutKind;
export const ANONYMOUS_DONOR = "Anonim";
export type Expenditure = {
  id: string;
  fund: FundType;
  description: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
};
export type FinanceTransaction = {
  id: string;
  fund: FundType;
  user: string;
  description: string;
  amount: number;
  date: string;
  message?: string;
  anonymous?: boolean;
};
