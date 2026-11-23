import { NextRequest } from "next/server";
import { financeRoute } from "@/services/finance/finance-route";
import {
  createPayment,
  createPaymentSchema,
} from "@/services/finance/payment-service";

export async function POST(req: NextRequest) {
  return financeRoute(req, async (user) =>
    createPayment(user.userId, createPaymentSchema.parse(await req.json())),
  );
}
