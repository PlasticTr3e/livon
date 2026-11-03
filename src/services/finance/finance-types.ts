import {
  BillStatus,
  FundType,
  TransactionType,
} from "@/generated/prisma/enums";

export interface ResidentBillSummary {
  id: string;
  title: string;
  month: number;
  year: number;
  amount: number;
  status: BillStatus;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
}

export interface KpiCardsSummary {
  // Exact fields expected by finance-store & new components:
  iplBalance: number;
  donationBalance: number;
  monthExpense: number;
  currentPeriod: string;
  outstandingIplPeriods: string[];
  iplPaidThrough: string;
  isIplPaid: boolean;
  donationIncome: number;
  donationCount: number;
  iplIncome: number;

  // Naming aliases to ensure 100% frontend compatibility with Indonesian variables
  monthlyExpense: number;
  saldoIpl: number;
  saldoDonasi: number;
  pengeluaranBulanIni: number;
  residentBill: ResidentBillSummary | null;
  statusTagihan: ResidentBillSummary | null;

  overview?: {
    totalIncomeThisMonth: number;
    totalExpenseThisMonth: number;
    activeMonth: number;
    activeYear: number;
  };
}

export interface TransactionAuthorDto {
  id: string;
  name: string;
}

export interface ExpenditureItem {
  id: string;
  fund: "ipl" | "donation";
  description: string;
  category: string;
  amount: number;
  date: string;
  note?: string | null;
}

export interface TransactionListItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  fundType: FundType;
  fund: "ipl" | "donation";
  category: string | null;
  proofUrl: string | null;
  date: string;
  transactionDate: string;
  note: string | null;
  recordedBy: TransactionAuthorDto | null;
  createdAt: string;
}

export interface PaginatedTransactionsResult {
  transactions: TransactionListItem[];
  expenditures: ExpenditureItem[];
  items?: TransactionListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ResidentBillItem {
  id: string;
  userId: string;
  title: string;
  month: number;
  year: number;
  amount: number;
  status: BillStatus;
  dueDate: string | null;
  paidAt: string | null;
  paymentProofUrl: string | null;
  notes: string | null;
  createdAt: string;
  residentName?: string;
  blockHouse?: string | null;
  houseNumber?: string | null;
}

export interface PaginatedBillsResult {
  bills: ResidentBillItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
