import type { NextRequest } from "next/server";
import { getBillingResidents } from "@/services/finance/admin-billing";
import { adminFinanceRoute } from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Warga terverifikasi + apakah sudah punya tagihan di periode tersebut. */
export async function GET(req: NextRequest) {
  return adminFinanceRoute(req, () =>
    getBillingResidents(req.nextUrl.searchParams.get("period") ?? undefined),
  );
}
