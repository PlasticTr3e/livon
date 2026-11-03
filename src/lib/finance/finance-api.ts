import type {
  CreateDonationInput,
  CreateExpenseInput,
  ExpenditureItem,
  GenerateBillsInput,
  KpiCardsSummary,
  PaginatedBillsResult,
  PaginatedTransactionsResult,
  PayBillInput,
  ResidentBillItem,
  TransactionListItem,
} from "./finance-types";

export class FinanceApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "FinanceApiError";
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("livon-token") : null;
  if (authenticated && !token) {
    throw new FinanceApiError("Please sign in to continue.", 401);
  }

  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", "Bearer " + token);
  if (typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, cache: "no-store" });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new FinanceApiError(
      "Unable to connect to finance server. Check your connection.",
      0,
    );
  }

  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new FinanceApiError(
      result?.message || "Request failed. Please try again.",
      response.status,
    );
  }

  return result.data as T;
}

/**
 * Fetch 4 realtime KPI Cards summary (IPL balance, donation balance, monthly expense, resident bill)
 */
export async function getFinanceSummary(): Promise<KpiCardsSummary> {
  return request<KpiCardsSummary>("/api/finance/summary", { method: "GET" });
}

/**
 * Fetch paginated transactions for transparency table.
 * Supports filtering by ?fund=ipl or ?fund=donation, ?type=IPL or ?type=DONATION.
 */
export async function getFinanceTransactions(params?: {
  fund?: "ipl" | "donation" | string;
  type?: "IPL" | "DONATION" | "DONASI" | "ALL" | string;
  fundType?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedTransactionsResult> {
  const searchParams = new URLSearchParams();

  if (params?.fund) searchParams.set("fund", params.fund);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.fundType) searchParams.set("fundType", params.fundType);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const url = `/api/finance/transactions${qs ? `?${qs}` : ""}`;

  return request<PaginatedTransactionsResult>(url, { method: "GET" });
}

/**
 * Fetch expenditures by fund ("ipl" | "donation") directly for ExpenditureTransparencyTable
 */
export async function getExpendituresByFund(
  fund: "ipl" | "donation",
): Promise<ExpenditureItem[]> {
  const result = await getFinanceTransactions({
    fund,
    type: "PENGELUARAN",
    limit: 100,
  });
  return result.expenditures || [];
}

/**
 * Submit a new expense transaction (Admin only)
 */
export async function createExpenseTransaction(
  data: CreateExpenseInput,
): Promise<TransactionListItem> {
  return request<TransactionListItem>(
    "/api/admin/finance/transactions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  );
}

/**
 * Record a new community donation to the DONASI fund
 */
export async function recordDonation(
  data: CreateDonationInput,
): Promise<TransactionListItem> {
  return request<TransactionListItem>(
    "/api/finance/donations",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    false,
  );
}

/**
 * Fetch resident bills (Warga gets own bills, Admin gets all)
 */
export async function getResidentBills(params?: {
  status?: string;
  month?: number;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedBillsResult> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.month) searchParams.set("month", String(params.month));
  if (params?.year) searchParams.set("year", String(params.year));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return request<PaginatedBillsResult>(
    `/api/finance/bills${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    true,
  );
}

/**
 * Batch generate monthly IPL bills for verified residents (Admin only)
 */
export async function generateMonthlyBills(
  data: GenerateBillsInput,
): Promise<{ generatedCount: number; message: string }> {
  return request<{ generatedCount: number; message: string }>(
    "/api/finance/bills/generate",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  );
}

/**
 * Submit payment proof for a resident bill (Resident)
 */
export async function payResidentBill(
  billId: string,
  data: PayBillInput,
): Promise<ResidentBillItem> {
  return request<ResidentBillItem>(
    `/api/finance/bills/${billId}/pay`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  );
}

/**
 * Verify resident bill payment and credit IPL fund (Admin only)
 */
export async function verifyResidentBill(
  billId: string,
): Promise<ResidentBillItem> {
  return request<ResidentBillItem>(
    `/api/finance/bills/${billId}/verify`,
    {
      method: "PATCH",
    },
    true,
  );
}

/**
 * Reject resident bill payment proof (Admin only)
 */
export async function rejectResidentBill(
  billId: string,
  reason?: string,
): Promise<ResidentBillItem> {
  return request<ResidentBillItem>(
    `/api/finance/bills/${billId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    },
    true,
  );
}
