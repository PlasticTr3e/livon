import type { NextRequest } from "next/server";
import {
  donationAdminQuery,
  getDonationAdmin,
} from "@/services/finance/admin-billing";
import {
  adminFinanceRoute,
  searchParamsOf,
} from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Total kas donasi + riwayat uang masuk / keluar dengan filter tanggal. */
export async function GET(req: NextRequest) {
  return adminFinanceRoute(req, () =>
    getDonationAdmin(donationAdminQuery.parse(searchParamsOf(req))),
  );
}
