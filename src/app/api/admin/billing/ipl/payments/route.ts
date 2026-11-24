import type { NextRequest } from "next/server";
import {
  periodDayQuery,
  getIplPayments,
} from "@/services/finance/admin-billing";
import {
  adminFinanceRoute,
  searchParamsOf,
} from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Riwayat IPL yang sudah dibayar, dalam satu periode, opsional per hari. */
export async function GET(req: NextRequest) {
  return adminFinanceRoute(req, () =>
    getIplPayments(periodDayQuery.parse(searchParamsOf(req))),
  );
}
