"use server";

import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@/generated/prisma/enums";
import { getAuthUser } from "@/lib/auth";
import { snap } from "@/lib/midtrans";
import { DONATION_MAX, DONATION_MIN } from "@/lib/payment/billing";
import { getResidentBills } from "@/services/finance/finance-service";

/**
 * Snap checkout for IPL & community donations. The amount is always computed
 * here (IPL from the resident's unpaid bills in the database, never from the
 * client) and the server key never leaves the server.
 */

const MAX_BILLS_PER_CHECKOUT = 24;
const SNAP_ITEM_NAME_MAX = 50;

const customerName = z.string().trim().max(80).optional();

const checkoutSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ipl"),
    billIds: z.array(z.uuid()).min(1).max(MAX_BILLS_PER_CHECKOUT),
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
  | {
      ok: true;
      token: string;
      redirectUrl: string;
      orderId: string;
      amount: number;
    }
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

async function getSignedInUser(authToken: string | null) {
  if (!authToken) return null;

  const request = new NextRequest("http://livon.local/payment", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  return getAuthUser(request);
}

/** Line items for the given bills, only if every one is the user's own and unpaid. */
async function getUnpaidBillItems(userId: string, billIds: string[]) {
  const { bills } = await getResidentBills(
    { userId, role: Role.WARGA },
    { status: "BELUM_BAYAR", page: 1, limit: 100 },
  );
  const wanted = new Set(billIds);
  const selected = bills.filter((bill) => wanted.has(bill.id));
  if (selected.length !== wanted.size) return null;

  return selected.map<SnapItem>((bill) => ({
    id: bill.id,
    name: bill.title.slice(0, SNAP_ITEM_NAME_MAX),
    price: Math.round(bill.amount),
    quantity: 1,
  }));
}

export async function createSnapCheckout(
  authToken: string | null,
  input: SnapCheckoutInput,
): Promise<SnapCheckoutResult> {
  const user = await getSignedInUser(authToken);
  if (!user) {
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
  let items: SnapItem[];

  if (data.kind === "ipl") {
    const billItems = await getUnpaidBillItems(user.userId, data.billIds);
    if (!billItems) {
      return {
        ok: false,
        error: "Tagihan sudah berubah. Muat ulang halaman lalu coba lagi.",
      };
    }
    items = billItems;
  } else {
    items = [
      {
        id: "DONASI-SOLIDARITAS",
        name: "Donasi Kantong Solidaritas",
        price: data.amount,
        quantity: 1,
      },
    ];
  }

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
    return {
      ok: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
      amount,
    };
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
  if (!orderId.startsWith("LIVON-") || !(await getSignedInUser(authToken))) {
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
