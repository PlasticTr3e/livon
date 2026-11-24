import type { NextRequest } from "next/server";
import { getIplReceipt } from "@/services/finance/admin-billing";
import { adminFinanceRoute } from "@/services/finance/admin-finance-route";

export const dynamic = "force-dynamic";

/** Detail pembayaran satu tagihan untuk nota. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ billId: string }> },
) {
  const { billId } = await params;
  return adminFinanceRoute(req, () => getIplReceipt(billId));
}
