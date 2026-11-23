import prisma from "@/lib/prisma";

export type DonationIncomeItem = {
  id: string;
  donorName: string;
  anonymous: boolean;
  amount: number;
  message: string | null;
  date: string;
  /** Only filled for pengurus: real name behind an anonymous donation. */
  realName?: string | null;
  paymentType?: string | null;
  paymentBank?: string | null;
};

export type DateRange = { gte: Date; lt: Date };

const MANUAL_TITLE_PREFIX = "Donasi Kas Perumahan - ";
const ANONYMOUS_LABELS = new Set(["hamba allah", "anonim", "anonymous"]);
const DEFAULT_MANUAL_NOTE = /^Donasi untuk kas perumahan dari /i;

/** Riwayat uang masuk ke kantong donasi (online via Midtrans maupun dicatat pengurus). */
export async function getDonationIncomes(
  page: number,
  limit: number,
  options: { range?: DateRange; forAdmin?: boolean } = {},
) {
  const where = {
    fundType: "DONASI" as const,
    type: "PEMASUKAN" as const,
    deletedAt: null,
  };
  const filtered = options.range
    ? { ...where, transactionDate: options.range }
    : where;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [rows, aggregate, thisMonth, filteredAggregate] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: filtered,
      orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        paymentOrder: {
          select: {
            payerName: true,
            anonymous: true,
            message: true,
            paymentType: true,
            paymentBank: true,
          },
        },
        recordedBy: {
          select: {
            email: true,
            citizenProfile: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.financialTransaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { ...where, transactionDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    options.range
      ? prisma.financialTransaction.aggregate({
          where: filtered,
          _sum: { amount: true },
          _count: true,
        })
      : null,
  ]);

  const items: DonationIncomeItem[] = rows.map((row) => {
    let donorName: string;
    let message: string | null = row.description;
    if (row.paymentOrder) {
      donorName = row.paymentOrder.payerName;
      message = row.paymentOrder.message;
    } else if (row.title.startsWith(MANUAL_TITLE_PREFIX)) {
      donorName = row.title.slice(MANUAL_TITLE_PREFIX.length);
    } else {
      donorName =
        row.recordedBy?.citizenProfile?.fullName ||
        row.recordedBy?.email.split("@")[0] ||
        "Warga";
    }
    const anonymous =
      row.paymentOrder?.anonymous ??
      ANONYMOUS_LABELS.has(donorName.trim().toLowerCase());
    if (message && DEFAULT_MANUAL_NOTE.test(message)) message = null;
    const item: DonationIncomeItem = {
      id: row.id,
      donorName: anonymous ? "Anonim" : donorName,
      anonymous,
      amount: Number(row.amount),
      message: message?.trim() || null,
      date: row.transactionDate.toISOString(),
    };
    if (options.forAdmin) {
      const realName =
        row.paymentOrder?.anonymous && row.paymentOrder.payerName !== "Anonim"
          ? row.paymentOrder.payerName
          : null;
      item.realName = realName;
      item.paymentType = row.paymentOrder?.paymentType ?? null;
      item.paymentBank = row.paymentOrder?.paymentBank ?? null;
    }
    return item;
  });

  const listCount = filteredAggregate?._count ?? aggregate._count;
  return {
    items,
    total: {
      amount: Number(aggregate._sum.amount ?? 0),
      count: aggregate._count,
    },
    thisMonth: {
      amount: Number(thisMonth._sum.amount ?? 0),
      count: thisMonth._count,
    },
    filtered: {
      amount: Number((filteredAggregate ?? aggregate)._sum.amount ?? 0),
      count: listCount,
    },
    pagination: {
      page,
      total: listCount,
      totalPages: Math.max(1, Math.ceil(listCount / limit)),
    },
  };
}
