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
  iplBalance: number;
  donationBalance: number;
  monthlyExpense: number;
  residentBill: ResidentBillSummary | null;
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

export interface TransactionListItem {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  fundType: FundType;
  category: string | null;
  proofUrl: string | null;
  transactionDate: string;
  recordedBy: TransactionAuthorDto | null;
  createdAt: string;
}

export interface PaginatedTransactionsResult {
  transactions: TransactionListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
