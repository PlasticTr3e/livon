import type { NextRequest } from "next/server";
import {
  getIplOverview,
  iplOverviewQuery,
} from "@/services/finance/admin-billing";
import {
  adminFinanceRoute,
  searchParamsOf,
} from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Ringkasan IPL per periode: metrik, tren 6 bulan, status tiap warga. */
export async function GET(req: NextRequest) {
  return adminFinanceRoute(req, () =>
    getIplOverview(iplOverviewQuery.parse(searchParamsOf(req))),
  );
}
