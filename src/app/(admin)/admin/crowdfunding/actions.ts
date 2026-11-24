"use server";

import { NextRequest } from "next/server";
import { z } from "zod";
import { BillStatus, Role } from "@/generated/prisma/enums";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Notifies WARGA accounts about their newly issued IPL bills. Runs right after
 * the admin issues bills (`POST /api/finance/bills/generate`). Each bill is
 * notified once: bills that already have an `IPL_BILL` notification are skipped.
 */

const IPL_BILL_NOTIFICATION_TYPE = "IPL_BILL";

const periodSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export type NotifyIplBillsResult =
  | { ok: true; notified: number }
  | { ok: false; error: string };

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDueDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

async function isAdmin(authToken: string | null) {
  if (!authToken) return false;

  const request = new NextRequest("http://livon.local/admin", {
    headers: { authorization: `Bearer ${authToken}` },
  });
  const user = await getAuthUser(request);
  return user?.role === Role.ADMIN;
}

export async function notifyIplBillsIssued(
  authToken: string | null,
  input: { month: number; year: number },
): Promise<NotifyIplBillsResult> {
  if (!(await isAdmin(authToken))) {
    return { ok: false, error: "Hanya admin yang dapat mengirim notifikasi." };
  }

  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Periode tagihan tidak valid." };
  }

  try {
    const bills = await prisma.residentBill.findMany({
      where: {
        month: parsed.data.month,
        year: parsed.data.year,
        status: BillStatus.BELUM_BAYAR,
        user: { role: Role.WARGA, deletedAt: null },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        amount: true,
        dueDate: true,
      },
    });
    if (bills.length === 0) return { ok: true, notified: 0 };

    const alreadyNotified = await prisma.notification.findMany({
      where: {
        type: IPL_BILL_NOTIFICATION_TYPE,
        referenceId: { in: bills.map((bill) => bill.id) },
      },
      select: { referenceId: true },
    });
    const notifiedIds = new Set(alreadyNotified.map((n) => n.referenceId));
    const pending = bills.filter((bill) => !notifiedIds.has(bill.id));
    if (pending.length === 0) return { ok: true, notified: 0 };

    await prisma.notification.createMany({
      data: pending.map((bill) => ({
        userId: bill.userId,
        referenceId: bill.id,
        type: IPL_BILL_NOTIFICATION_TYPE,
        title: "Tagihan IPL baru",
        message: [
          `${bill.title} sebesar ${formatRupiah(Number(bill.amount))} sudah terbit.`,
          bill.dueDate ? `Jatuh tempo ${formatDueDate(bill.dueDate)}.` : null,
          "Bayar lewat menu Billing & Care.",
        ]
          .filter(Boolean)
          .join(" "),
      })),
    });

    return { ok: true, notified: pending.length };
  } catch (error) {
    console.error("Notify IPL bills error:", error);
    return { ok: false, error: "Notifikasi tagihan gagal dikirim." };
  }
}
