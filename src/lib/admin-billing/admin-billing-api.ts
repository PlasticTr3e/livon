import type {
  AssignIplInput,
  AssignIplResult,
  BillingResident,
  DonationAdminOverview,
  DonationLedger,
  IplOverview,
  IplPaymentCategory,
  IplPaymentList,
  IplReceipt,
} from "./admin-billing-types";

export class AdminBillingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const token = localStorage.getItem("livon-token");
  if (!token)
    throw new AdminBillingError("Silakan masuk sebagai pengurus.", 401);
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      signal,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new AdminBillingError(
      "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
      0,
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success)
    throw new AdminBillingError(
      result?.message || "Data belum dapat dimuat. Coba lagi.",
      response.status,
    );
  return result.data as T;
}

const query = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

export const fetchIplOverview = (
  params: {
    period: string;
    page: number;
    category: "ALL" | IplPaymentCategory;
  },
  signal?: AbortSignal,
) =>
  request<IplOverview>(`/api/admin/billing/ipl?${query(params)}`, {}, signal);

export const fetchIplPayments = (
  params: { period: string; day?: string; page: number },
  signal?: AbortSignal,
) =>
  request<IplPaymentList>(
    `/api/admin/billing/ipl/payments?${query(params)}`,
    {},
    signal,
  );

export const fetchIplReceipt = (billId: string) =>
  request<IplReceipt>(
    `/api/admin/billing/ipl/receipt/${encodeURIComponent(billId)}`,
  );

export const fetchBillingResidents = (period: string) =>
  request<BillingResident[]>(
    `/api/admin/billing/residents?${query({ period })}`,
  );

export const assignIplBills = (input: AssignIplInput) =>
  request<AssignIplResult>("/api/admin/billing/ipl/bills", {
    method: "POST",
    body: JSON.stringify(input),
  });

export const fetchDonationAdmin = (
  params: {
    ledger: DonationLedger;
    period: string;
    day?: string;
    page: number;
  },
  signal?: AbortSignal,
) =>
  request<DonationAdminOverview>(
    `/api/admin/billing/donations?${query(params)}`,
    {},
    signal,
  );

/** Uses the existing expense endpoint (AGENCY only, balance-checked server side). */
export const withdrawDonation = (input: {
  title: string;
  amount: number;
  category: string;
  description: string | null;
  proofUrl: string | null;
  transactionDate: string;
}) =>
  request("/api/finance/transactions", {
    method: "POST",
    body: JSON.stringify({ ...input, fundType: "DONASI" }),
  });
