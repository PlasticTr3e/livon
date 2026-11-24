import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  refreshPayment,
  PaymentError,
} from "@/services/finance/payment-service";

const notificationSchema = z.object({
  order_id: z.string().startsWith("LIVON-").max(100),
  status_code: z.string().max(10),
  gross_amount: z.string().max(30),
  signature_key: z.string().regex(/^[a-f0-9]{128}$/i),
});

export async function POST(req: NextRequest) {
  try {
    const body = notificationSchema.safeParse(await req.json());
    if (!body.success)
      return NextResponse.json({ success: false }, { status: 400 });
    const key = process.env.MIDTRANS_SERVER_KEY;
    if (!key) return NextResponse.json({ success: false }, { status: 503 });
    const { order_id, status_code, gross_amount, signature_key } = body.data;
    const expected = createHash("sha512")
      .update(order_id + status_code + gross_amount + key)
      .digest();
    if (!timingSafeEqual(expected, Buffer.from(signature_key, "hex")))
      return NextResponse.json({ success: false }, { status: 403 });
    await refreshPayment(order_id, undefined, undefined, true);
    return NextResponse.json({ success: true });
  } catch (error) {
    const status =
      error instanceof PaymentError
        ? error.status
        : error instanceof SyntaxError
          ? 400
          : 503;
    return NextResponse.json({ success: false }, { status });
  }
}
