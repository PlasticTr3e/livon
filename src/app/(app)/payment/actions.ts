"use server";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import type { CreatePaymentInput } from "@/lib/payment/finance-types";
import {
  createPayment,
  refreshPayment,
} from "@/services/finance/payment-service";

export type SnapCheckoutInput = CreatePaymentInput;
export type SnapCheckoutResult =
  | { ok: true; token: string; orderId: string; amount: number }
  | { ok: false; error: string };
export type SnapCheckoutStatus = {
  status: "paid" | "pending" | "failed" | "unknown";
  paymentType?: string;
};

async function authenticate(token: string | null) {
  if (!token) return null;
  return getAuthUser(
    new NextRequest("http://livon.local/payment", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
}
export async function createSnapCheckout(
  token: string | null,
  input: SnapCheckoutInput,
): Promise<SnapCheckoutResult> {
  const user = await authenticate(token);
  if (!user) return { ok: false, error: "Silakan masuk kembali." };
  try {
    const order = await createPayment(user.userId, input);
    if (!order.snapToken)
      return {
        ok: false,
        error: "Transaksi sedang disiapkan. Periksa riwayat pembayaran.",
      };
    return {
      ok: true,
      token: order.snapToken,
      orderId: order.id,
      amount: order.amount,
    };
  } catch {
    return {
      ok: false,
      error: "Pembayaran belum dapat dibuat. Silakan periksa riwayat Anda.",
    };
  }
}
export async function getSnapCheckoutStatus(
  token: string | null,
  orderId: string,
): Promise<SnapCheckoutStatus> {
  const user = await authenticate(token);
  if (!user) return { status: "unknown" };
  try {
    const order = await refreshPayment(orderId, user.userId);
    return {
      status:
        order.status === "PAID"
          ? "paid"
          : ["FAILED", "CANCELLED", "EXPIRED"].includes(order.status)
            ? "failed"
            : "pending",
      paymentType: order.paymentType ?? undefined,
    };
  } catch {
    return { status: "unknown" };
  }
}
