"use server";

import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { snap } from "@/lib/midtrans";
import {
  DONATION_MAX,
  DONATION_MIN,
  formatBillingPeriod,
  IPL_MAX_MONTHS,
  IPL_MONTHLY_FEE,
  isBillingPeriod,
} from "@/lib/payment/billing";

/**
 * Snap checkout for IPL & community donations. The amount is always computed
 * here (never trusted from the client) and the server key never leaves the server.
 */

const customerName = z.string().trim().max(80).optional();

const checkoutSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ipl"),
    periods: z
      .array(z.string().refine(isBillingPeriod))
      .min(1)
      .max(IPL_MAX_MONTHS),
    customerName,
  }),
  z.object({
    kind: z.literal("donation"),
    amount: z.number().int().min(DONATION_MIN).max(DONATION_MAX),
    customerName,
  }),
]);

export type SnapCheckoutInput = z.input<typeof checkoutSchema>;

export type SnapCheckoutResult =
  | { ok: true; token: string; orderId: string; amount: number }
  | { ok: false; error: string };

export type SnapCheckoutStatus = {
  status: "paid" | "pending" | "failed" | "unknown";
  paymentType?: string;
};

type SnapItem = { id: string; name: string; price: number; quantity: number };

type SnapTransactionApi = {
  transaction: {
    status: (
      orderId: string,
    ) => Promise<{ transaction_status?: string; payment_type?: string }>;
  };
};

async function isSignedIn(authToken: string | null) {
  if (!authToken) return false;

  const request = new NextRequest("http://livon.local/payment", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  return Boolean(await getAuthUser(request));
}

export async function createSnapCheckout(
  authToken: string | null,
  input: SnapCheckoutInput,
): Promise<SnapCheckoutResult> {
  if (!(await isSignedIn(authToken))) {
    return {
      ok: false,
      error: "Sesi Anda berakhir. Silakan masuk kembali untuk membayar.",
    };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Rincian pembayaran tidak valid." };
  }

  const data = parsed.data;
  const items: SnapItem[] =
    data.kind === "ipl"
      ? [...new Set(data.periods)].sort().map((period) => ({
          id: `IPL-${period}`,
          name: `IPL ${formatBillingPeriod(period)}`,
          price: IPL_MONTHLY_FEE,
          quantity: 1,
        }))
      : [
          {
            id: "DONASI-SOLIDARITAS",
            name: "Donasi Kantong Solidaritas",
            price: data.amount,
            quantity: 1,
          },
        ];

  const amount = items.reduce((total, item) => total + item.price, 0);
  const prefix = data.kind === "ipl" ? "IPL" : "DON";
  const orderId = `LIVON-${prefix}-${Date.now()}-${randomUUID().slice(0, 4)}`;

  const parameter = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    item_details: items,
    customer_details: { first_name: data.customerName || "Warga LIVON" },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return { ok: true, token: transaction.token, orderId, amount };
  } catch (error) {
    console.error("Snap checkout error:", error);
    return {
      ok: false,
      error: "Gagal terhubung ke Midtrans. Coba lagi beberapa saat lagi.",
    };
  }
}

export async function getSnapCheckoutStatus(
  authToken: string | null,
  orderId: string,
): Promise<SnapCheckoutStatus> {
  if (!orderId.startsWith("LIVON-") || !(await isSignedIn(authToken))) {
    return { status: "unknown" };
  }

  try {
    const result = await (
      snap as unknown as SnapTransactionApi
    ).transaction.status(orderId);
    const status = result.transaction_status ?? "";

    if (status === "settlement" || status === "capture") {
      return { status: "paid", paymentType: result.payment_type };
    }
    if (["deny", "cancel", "expire", "failure"].includes(status)) {
      return { status: "failed", paymentType: result.payment_type };
    }
    return { status: "pending", paymentType: result.payment_type };
  } catch {
    // Midtrans answers 404 until a payment method has been chosen.
    return { status: "pending" };
  }
}
