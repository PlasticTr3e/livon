import { canManage } from "@/lib/permissions";
import type { NextRequest } from "next/server";
import type { AuthPayload } from "@/lib/auth";
import { financeRoute } from "./finance-route";
import { PaymentError } from "./payment-service";

/** financeRoute for pengurus only: 401 when signed out, 403 for users without management access. */
export function adminFinanceRoute(
  req: NextRequest,
  action: (user: AuthPayload) => Promise<unknown>,
) {
  return financeRoute(req, async (user) => {
    if (!canManage(user.role))
      throw new PaymentError(
        "Hanya pengurus yang dapat membuka data ini.",
        403,
      );
    return action(user);
  });
}

export function searchParamsOf(req: NextRequest) {
  return Object.fromEntries(req.nextUrl.searchParams);
}
