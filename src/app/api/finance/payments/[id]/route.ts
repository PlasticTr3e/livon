import { NextRequest } from "next/server";
import { financeRoute } from "@/services/finance/finance-route";
import { refreshPayment } from "@/services/finance/payment-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return financeRoute(req, async (user) =>
    refreshPayment((await params).id, user.userId),
  );
}
