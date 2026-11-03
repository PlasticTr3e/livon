export type BillStatus = "BELUM_BAYAR" | "LUNAS" | "MENUNGGU_VERIFIKASI";
export type FundType = "IPL" | "DONASI";
export type TransactionType = "PEMASUKAN" | "PENGELUARAN";

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
  monthExpense: number;
  currentPeriod: string;
  outstandingIplPeriods: string[];
  iplPaidThrough: string;
  isIplPaid: boolean;
  donationIncome: number;
  donationCount: number;
  iplIncome: number;

  // Indonesian aliases
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

export interface TransactionAuthor {
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
  recordedBy: TransactionAuthor | null;
  createdAt: string;
}

export interface FinancePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTransactionsResult {
  transactions: TransactionListItem[];
  expenditures: ExpenditureItem[];
  items?: TransactionListItem[];
  pagination: FinancePagination;
}

export interface CreateExpenseInput {
  title?: string;
  description?: string | null;
  amount: number;
  fund?: "ipl" | "donation";
  fundType?: "IPL" | "DONASI" | "DONATION";
  category: string;
  proofUrl?: string | null;
  date?: string | Date;
  transactionDate?: string | Date;
  note?: string | null;
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
  pagination: FinancePagination;
}

export interface CreateDonationInput {
  amount: number;
  donorName?: string | null;
  description?: string | null;
  proofUrl?: string | null;
  isAnonymous?: boolean;
}

export interface GenerateBillsInput {
  month: number;
  year: number;
  amount: number;
  title?: string;
  dueDate?: string | Date;
}

export interface PayBillInput {
  paymentProofUrl: string;
  notes?: string | null;
}
