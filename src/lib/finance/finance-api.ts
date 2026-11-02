import type {
  CreateExpenseInput,
  KpiCardsSummary,
  PaginatedTransactionsResult,
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
 * Supports filtering by ?type=IPL or ?type=DONATION.
 */
export async function getFinanceTransactions(params?: {
  type?: "IPL" | "DONATION" | "DONASI" | "ALL" | string;
  fundType?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedTransactionsResult> {
  const searchParams = new URLSearchParams();

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
 * Submit a new expense transaction (Admin only)
 */
export async function createExpenseTransaction(
  data: CreateExpenseInput,
): Promise<TransactionListItem> {
  return request<TransactionListItem>(
    "/api/admin/transactions",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  );
}
