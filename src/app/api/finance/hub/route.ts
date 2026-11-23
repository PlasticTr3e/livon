import { NextRequest } from "next/server";
import { financeRoute } from "@/services/finance/finance-route";
import { getFinanceHub, financeHubQuery } from "@/services/finance/finance-hub";

export async function GET(req: NextRequest) {
  return financeRoute(req, (user) =>
    getFinanceHub(
      user,
      financeHubQuery.parse(Object.fromEntries(req.nextUrl.searchParams)),
    ),
  );
}
