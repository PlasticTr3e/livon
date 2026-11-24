import { randomUUID } from "node:crypto";
import { notifyPaidPayment } from "./billing-notifications";
import { z } from "zod";
import prisma from "@/lib/prisma";
import type { PaymentOrder } from "@/generated/prisma/client";
import type {
  CreatePaymentInput,
  PaymentRecord,
  PaymentState,
} from "@/lib/payment/finance-types";
import {
  DONATION_MAX,
  DONATION_MIN,
  DONATION_MESSAGE_MAX,
} from "@/lib/payment/billing";
import {
  gatewayPaymentBank,
  paymentGateway,
  type GatewayStatus,
  type PaymentGateway,
} from "./payment-gateway";

export const createPaymentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ipl"),
    billId: z.string().uuid(),
    requestId: z.string().uuid(),
  }),
  z.object({
    kind: z.literal("donation"),
    amount: z.number().int().min(DONATION_MIN).max(DONATION_MAX),
    anonymous: z.boolean().default(false),
    message: z.string().trim().max(DONATION_MESSAGE_MAX).default(""),
    requestId: z.string().uuid(),
  }),
]);

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export function paymentRecord(
  order: PaymentOrder,
  token = false,
): PaymentRecord {
  return {
    id: order.id,
    kind: order.fundType === "IPL" ? "ipl" : "donation",
    billId: order.billId,
    title: order.title,
    amount: Number(order.amount),
    status: order.status as PaymentState,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    paymentType: order.paymentType,
    ...(token ? { snapToken: order.snapToken } : {}),
  };
}

export async function createPayment(
  userId: string,
  input: CreatePaymentInput,
  gateway: PaymentGateway = paymentGateway,
) {
  const data = createPaymentSchema.parse(input);
  if (
    gateway === paymentGateway &&
    (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY)
  ) {
    throw new PaymentError(
      "Pembayaran online belum diaktifkan. Hubungi pengelola.",
      503,
    );
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: { citizenProfile: true, agencyProfile: true },
  });
  if (!user)
    throw new PaymentError("Sesi berakhir. Silakan masuk kembali.", 401);
  const requestKey = `${userId}:${data.requestId}`;
  const payerName =
    user.citizenProfile?.fullName ||
    user.agencyProfile?.agencyName ||
    "Warga Livon";
  const reserved = await prisma.$transaction(async (tx) => {
    if (data.kind === "ipl") {
      await tx.$queryRaw`SELECT "id" FROM "resident_bills" WHERE "id" = ${data.billId} FOR UPDATE`;
    }
    const existing = await tx.paymentOrder.findUnique({
      where: { requestKey },
    });
    if (existing) {
      if (
        (data.kind === "ipl" && existing.billId !== data.billId) ||
        (data.kind === "donation" &&
          (existing.fundType !== "DONASI" ||
            Number(existing.amount) !== data.amount ||
            existing.anonymous !== data.anonymous ||
            existing.message !== data.message))
      ) {
        throw new PaymentError(
          "Rincian pembayaran berubah. Mulai permintaan baru.",
          409,
        );
      }
      return { order: existing, created: false };
    }
    let amount: number;
    let title: string;
    if (data.kind === "ipl") {
      const bill = await tx.residentBill.findUnique({
        where: { id: data.billId },
      });
      if (!bill || bill.userId !== userId)
        throw new PaymentError("Tagihan tidak ditemukan.", 404);
      if (bill.status !== "BELUM_BAYAR")
        throw new PaymentError(
          "Tagihan sudah dibayar atau sedang diverifikasi.",
          409,
        );
      const active = await tx.paymentOrder.findFirst({
        where: { billId: bill.id, status: { in: ["CREATING", "PENDING"] } },
      });
      if (
        active &&
        active.status === "CREATING" &&
        !active.snapToken &&
        Date.now() - active.createdAt.getTime() > 60000
      ) {
        await tx.paymentOrder.update({
          where: { id: active.id },
          data: { status: "FAILED" },
        });
      } else if (active) return { order: active, created: false };
      amount = Number(bill.amount);
      if (!Number.isSafeInteger(amount) || amount <= 0)
        throw new PaymentError(
          "Nominal tagihan tidak valid. Hubungi pengelola.",
        );
      title = bill.title;
    } else {
      amount = data.amount;
      title = "Donasi warga";
    }
    const order = await tx.paymentOrder.create({
      data: {
        id: `LIVON-${randomUUID()}`,
        requestKey,
        userId,
        payerName,
        title,
        billId: data.kind === "ipl" ? data.billId : null,
        fundType: data.kind === "ipl" ? "IPL" : "DONASI",
        amount,
        anonymous: data.kind === "donation" && data.anonymous,
        message: data.kind === "donation" ? data.message : null,
        expiresAt: new Date(Date.now() + 24 * 3600000),
      },
    });
    return { order, created: true };
  });
  if (!reserved.created) {
    if (reserved.order.status === "CREATING")
      throw new PaymentError(
        "Pembayaran sedang disiapkan. Coba lagi sebentar.",
        409,
      );
    return paymentRecord(reserved.order, true);
  }
  try {
    const result = await gateway.create({
      id: reserved.order.id,
      amount: Number(reserved.order.amount),
      title:
        data.kind === "ipl" ? "Iuran Pengelolaan Lingkungan" : "Donasi warga",
      payerName,
      email: user.email,
      createdAt: reserved.order.createdAt,
    });
    const updated = await prisma.paymentOrder.update({
      where: { id: reserved.order.id },
      data: { snapToken: result.token, status: "PENDING" },
    });
    return paymentRecord(updated, true);
  } catch {
    await prisma.paymentOrder.updateMany({
      where: { id: reserved.order.id, status: "CREATING" },
      data: { status: "FAILED" },
    });
    throw new PaymentError(
      "Pembayaran online belum dapat disiapkan. Cek riwayat pembayaran atau coba lagi nanti.",
      503,
    );
  }
}

export function gatewayPaymentState(status: GatewayStatus): PaymentState {
  if (
    (status.transaction_status === "settlement" ||
      status.transaction_status === "capture") &&
    (!status.fraud_status || status.fraud_status === "accept")
  )
    return "PAID";
  if (status.transaction_status === "expire") return "EXPIRED";
  if (status.transaction_status === "cancel") return "CANCELLED";
  if (["deny", "failure"].includes(status.transaction_status)) return "FAILED";
  return "PENDING";
}

export async function reconcilePayment(id: string, status: GatewayStatus) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "payment_orders" WHERE "id" = ${id} FOR UPDATE`;
    const order = await tx.paymentOrder.findUnique({ where: { id } });
    if (!order) throw new PaymentError("Transaksi tidak ditemukan.", 404);
    if (
      status.order_id !== id ||
      !Number.isFinite(Number(status.gross_amount)) ||
      Number(status.gross_amount) !== Number(order.amount) ||
      (status.currency && status.currency !== "IDR")
    )
      throw new PaymentError("Rincian transaksi tidak sesuai.", 409);
    if (["PAID", "REVIEW"].includes(order.status)) return order;
    const next = gatewayPaymentState(status);
    if (next !== "PAID")
      return tx.paymentOrder.update({
        where: { id },
        data: {
          status: next,
          paymentType: status.payment_type,
          paymentBank: gatewayPaymentBank(status),
          gatewayTransactionId: status.transaction_id ?? null,
        },
      });
    let review = false;
    if (order.billId) {
      await tx.$queryRaw`SELECT "id" FROM "resident_bills" WHERE "id" = ${order.billId} FOR UPDATE`;
      const bill = await tx.residentBill.findUniqueOrThrow({
        where: { id: order.billId },
      });
      review = bill.status === "LUNAS";
      if (!review)
        await tx.residentBill.update({
          where: { id: bill.id },
          data: { status: "LUNAS", paidAt: new Date() },
        });
    }
    await tx.financialTransaction.create({
      data: {
        title: review
          ? "Pembayaran IPL perlu pemeriksaan"
          : order.fundType === "IPL"
            ? "Pembayaran IPL"
            : "Donasi warga",
        description: order.message,
        amount: order.amount,
        type: "PEMASUKAN",
        fundType: order.fundType,
        category: review
          ? "Perlu rekonsiliasi"
          : order.fundType === "IPL"
            ? "Iuran IPL"
            : "Donasi",
        paymentOrderId: id,
        residentBillId: review ? null : order.billId,
        recordedById: order.anonymous ? null : order.userId,
      },
    });
    await tx.financeSummary.upsert({
      where: { fundType: order.fundType },
      create: {
        fundType: order.fundType,
        balance: order.amount,
        totalIncome: order.amount,
      },
      update: {
        balance: { increment: order.amount },
        totalIncome: { increment: order.amount },
      },
    });
    if (!review) await notifyPaidPayment(tx, { ...order, paidAt: new Date() });
    return tx.paymentOrder.update({
      where: { id },
      data: {
        status: review ? "REVIEW" : "PAID",
        paidAt: new Date(),
        paymentType: status.payment_type,
        paymentBank: gatewayPaymentBank(status),
        gatewayTransactionId: status.transaction_id ?? null,
      },
    });
  });
}

export async function refreshPayment(
  id: string,
  userId?: string,
  gateway: PaymentGateway = paymentGateway,
  strict = false,
) {
  const order = await prisma.paymentOrder.findFirst({
    where: { id, ...(userId ? { userId } : {}) },
  });
  if (!order) throw new PaymentError("Transaksi tidak ditemukan.", 404);
  if (["PAID", "REVIEW"].includes(order.status))
    return paymentRecord(order, true);
  let status: GatewayStatus | null;
  try {
    status = await gateway.status(id);
  } catch (error) {
    if (strict) throw error;
    return {
      ...paymentRecord(order, true),
      warning:
        "Status terakhir tersimpan. Midtrans belum dapat diperiksa; coba lagi sebentar.",
    };
  }
  if (status) return paymentRecord(await reconcilePayment(id, status), true);
  if (strict) throw new PaymentError("Status gateway belum tersedia.", 503);
  if (
    order.status === "CREATING" &&
    !order.snapToken &&
    Date.now() - order.createdAt.getTime() > 60000
  ) {
    await prisma.paymentOrder.updateMany({
      where: { id, status: "CREATING", snapToken: null },
      data: { status: "FAILED" },
    });
    return paymentRecord(
      await prisma.paymentOrder.findUniqueOrThrow({ where: { id } }),
      true,
    );
  }
  if (order.expiresAt < new Date()) {
    const expired = await prisma.paymentOrder.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return paymentRecord(expired, true);
  }
  return paymentRecord(order, true);
}
