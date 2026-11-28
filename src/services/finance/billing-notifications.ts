import type { Prisma } from "@/generated/prisma/client";

type NotificationDb = Pick<Prisma.TransactionClient, "notification">;
type PaidPayment = {
  id: string;
  userId: string;
  billId: string | null;
  fundType: string;
  amount: unknown;
  paidAt?: Date | null;
};
const rupiah = (amount: unknown) =>
  `Rp ${Number(amount).toLocaleString("id-ID")}`;
const reminderTypes = ["bill_unpaid", "bill_overdue"];

/** Called inside the same transaction that credits the payment. */
export async function notifyPaidPayment(
  db: NotificationDb,
  order: PaidPayment,
) {
  const donation = order.fundType === "DONASI";
  await db.notification.createMany({
    data: [
      {
        id: `billing-paid-${order.billId || order.id}`,
        userId: order.userId,
        referenceId: order.id,
        type: donation ? "donation_success" : "payment_success",
        title: donation ? "Donasi berhasil" : "Pembayaran IPL berhasil",
        message: donation
          ? `Donasi Anda sebesar ${rupiah(order.amount)} telah diterima dan dicatat di kas donasi. Terima kasih.`
          : `Pembayaran IPL sebesar ${rupiah(order.amount)} telah dikonfirmasi. Tagihan Anda sudah lunas.`,
        ...(order.paidAt ? { createdAt: order.paidAt } : {}),
      },
    ],
    skipDuplicates: true,
  });
  if (order.billId)
    await db.notification.updateMany({
      where: {
        userId: order.userId,
        referenceId: order.billId,
        type: { in: reminderTypes },
        isRead: false,
      },
      data: { isRead: true },
    });
}

/** Backfill existing events and evaluate deadline changes whenever the inbox polls. */
export async function syncBillingNotifications(
  db: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
) {
  const [bills, paidOrders] = await Promise.all([
    db.residentBill.findMany({
      where: { userId },
      include: {
        paymentOrders: { where: { status: "PAID" }, select: { id: true } },
      },
    }),
    db.paymentOrder.findMany({ where: { userId, status: "PAID" } }),
  ]);
  for (const order of paidOrders) await notifyPaidPayment(db, order);
  for (const bill of bills) {
    if (bill.status === "LUNAS") {
      if (!bill.paymentOrders.length)
        await notifyPaidPayment(db, {
          id: bill.id,
          userId,
          billId: bill.id,
          fundType: "IPL",
          amount: bill.amount,
          paidAt: bill.paidAt,
        });
      continue;
    }
    if (bill.status !== "BELUM_BAYAR") {
      await db.notification.updateMany({
        where: {
          userId,
          referenceId: bill.id,
          type: { in: reminderTypes },
          isRead: false,
        },
        data: { isRead: true },
      });
      continue;
    }
    const due = bill.dueDate ? new Date(bill.dueDate) : null;
    if (due) due.setHours(23, 59, 59, 999);
    const overdue = Boolean(due && due < now);
    const type = overdue ? "bill_overdue" : "bill_unpaid";
    if (overdue)
      await db.notification.updateMany({
        where: {
          userId,
          referenceId: bill.id,
          type: "bill_unpaid",
          isRead: false,
        },
        data: { isRead: true },
      });
    const dueText = due
      ? ` Jatuh tempo ${due.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`
      : "";
    await db.notification.createMany({
      data: [
        {
          id: `billing-${type}-${bill.id}`,
          userId,
          referenceId: bill.id,
          type,
          title: overdue
            ? "Tagihan IPL lewat jatuh tempo"
            : "Tagihan IPL belum dibayar",
          message: `${bill.title} sebesar ${rupiah(bill.amount)} ${overdue ? "sudah lewat jatuh tempo. Hubungi CS perumahan untuk penyelesaian." : "belum dibayar."}${dueText}`,
        },
      ],
      skipDuplicates: true,
    });
  }
}
