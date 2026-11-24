/** Shared types for the admin Billing & Care dashboard (API + UI). */

export type Pagination = { page: number; total: number; totalPages: number };

/** How a resident's bill for a period is classified for the admin. */
export type IplPaymentCategory =
  | "TEPAT_WAKTU"
  | "TERLAMBAT"
  | "MENUNGGU"
  | "NUNGGAK"
  | "BELUM_JATUH_TEMPO";

export type BillItem = { label: string; amount: number };

export type IplResidentRow = {
  billId: string;
  userId: string;
  name: string;
  house: string;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  category: IplPaymentCategory;
};

export type IplTrendPoint = {
  period: string; // YYYY-MM
  label: string; // "Nov 26"
  TEPAT_WAKTU: number;
  TERLAMBAT: number;
  MENUNGGU: number;
  NUNGGAK: number;
  BELUM_JATUH_TEMPO: number;
};

export type IplOverview = {
  period: string;
  metrics: {
    billedAmount: number;
    billedCount: number;
    paidAmount: number;
    paidCount: number;
    unpaidAmount: number;
    unpaidCount: number;
    overdueCount: number;
    onTimeRate: number; // 0-100, of paid or past-due bills; excludes unpaid bills not yet due
    residentCount: number;
    unbilledCount: number;
    houseCount: number;
    billedHouseCount: number;
  };
  breakdown: Record<IplPaymentCategory, number>;
  trend: IplTrendPoint[];
  residents: IplResidentRow[];
  residentPagination: Pagination;
};

export type IplPaymentRow = {
  billId: string;
  paidAt: string;
  name: string;
  house: string;
  period: string; // "November 2026"
  amount: number;
  method: string | null;
  bank: string | null;
  source: "ONLINE" | "MANUAL";
};

export type IplPaymentList = {
  rows: IplPaymentRow[];
  totalAmount: number;
  pagination: Pagination;
};

export type IplReceipt = {
  billId: string;
  receiptNumber: string;
  name: string;
  email: string;
  house: string;
  period: string;
  title: string;
  items: BillItem[];
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  status: "BELUM_BAYAR" | "LUNAS" | "MENUNGGU_VERIFIKASI";
  method: string | null;
  bank: string | null;
  orderId: string | null;
  gatewayTransactionId: string | null;
  source: "ONLINE" | "MANUAL";
};

export type BillingResident = {
  id: string;
  name: string;
  house: string;
  hasBill: boolean;
};

export type AssignIplInput = {
  month: number;
  year: number;
  dueDate: string;
  title?: string;
  items: BillItem[];
  /** Empty = semua warga terverifikasi. */
  userIds: string[];
};

export type AssignIplResult = { created: number; skipped: number };

export type DonationLedger = "IN" | "OUT";

export type DonationOutRow = {
  id: string;
  date: string;
  title: string;
  category: string | null;
  description: string | null;
  amount: number;
  proofUrl: string | null;
  admin: string;
};

export type DonationInRow = {
  id: string;
  date: string;
  donorName: string;
  anonymous: boolean;
  realName: string | null;
  message: string | null;
  amount: number;
  method: string | null;
  bank: string | null;
};

export type DonationTrendPoint = {
  period: string; // YYYY-MM
  label: string; // "Jan"
  count: number;
  amount: number;
};

export type DonationAdminOverview = {
  period: string;
  year: number;
  totals: {
    balance: number;
    periodIn: number;
    periodInCount: number;
    periodOut: number;
    periodOutCount: number;
  };
  trend: DonationTrendPoint[];
  ledger: DonationLedger;
  inRows: DonationInRow[];
  outRows: DonationOutRow[];
  filteredAmount: number;
  pagination: Pagination;
};
