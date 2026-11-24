import { z } from "zod";
import prisma from "@/lib/prisma";
import { parseBillItems } from "@/lib/finance/bill-items";
import { Prisma } from "@/generated/prisma/client";
import type {
  AssignIplResult,
  BillingResident,
  DonationAdminOverview,
  DonationLedger,
  IplOverview,
  IplPaymentCategory,
  IplPaymentList,
  IplReceipt,
  IplResidentRow,
  IplTrendPoint,
} from "@/lib/admin-billing/admin-billing-types";
import { getDonationIncomes, type DateRange } from "./donation-feed";
import { PaymentError } from "./payment-service";

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const periodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Periode harus YYYY-MM");

function parsePeriod(period?: string | null) {
  const now = new Date();
  const value =
    period && periodSchema.safeParse(period).success
      ? period
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = value.split("-").map(Number);
  return { value, year, month };
}

function periodKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function periodLabel(year: number, month: number, style: "long" | "short") {
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
    month: style,
    year: style === "long" ? "numeric" : "2-digit",
  });
}

function houseOf(
  profile?: {
    blockHouse: string | null;
    houseNumber: string | null;
  } | null,
) {
  return [profile?.blockHouse, profile?.houseNumber].filter(Boolean).join(" ");
}

function nameOf(user: {
  email: string;
  citizenProfile?: { fullName: string } | null;
}) {
  return user.citizenProfile?.fullName || user.email.split("@")[0];
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

/** Classify one bill the same way the admin reads it. */
export function categorizeBill(
  bill: { status: string; dueDate: Date | null; paidAt: Date | null },
  now = new Date(),
): IplPaymentCategory {
  if (bill.status === "MENUNGGU_VERIFIKASI") return "MENUNGGU";
  const due = bill.dueDate ? endOfDay(bill.dueDate) : null;
  if (bill.status === "LUNAS") {
    if (due && bill.paidAt && bill.paidAt > due) return "TERLAMBAT";
    return "TEPAT_WAKTU";
  }
  return due && due < now ? "NUNGGAK" : "BELUM_JATUH_TEMPO";
}

const emptyBreakdown = (): Record<IplPaymentCategory, number> => ({
  TEPAT_WAKTU: 0,
  TERLAMBAT: 0,
  MENUNGGU: 0,
  NUNGGAK: 0,
  BELUM_JATUH_TEMPO: 0,
});

const CATEGORY_ORDER: IplPaymentCategory[] = [
  "NUNGGAK",
  "BELUM_JATUH_TEMPO",
  "MENUNGGU",
  "TERLAMBAT",
  "TEPAT_WAKTU",
];

/** Riwayat dalam satu periode (bulan), opsional dipersempit ke satu hari di bulan itu. */
export const periodDayQuery = z.object({
  period: z.string().optional(),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  page: z.coerce.number().int().positive().default(1),
});

/** Range for the whole month, or one day when `day` falls inside that month. */
export function rangeForPeriodDay(period?: string, day?: string): DateRange {
  const { value, year, month } = parsePeriod(period);
  if (day && day.startsWith(value)) {
    const d = Number(day.slice(8, 10));
    return {
      gte: new Date(year, month - 1, d),
      lt: new Date(year, month - 1, d + 1),
    };
  }
  return { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
}

function pagination(page: number, total: number) {
  return {
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

const residentWhere = {
  isVerified: true,
  user: { deletedAt: null, role: "WARGA" as const },
};

/* ------------------------------------------------------------------ */
/* IPL                                                                 */
/* ------------------------------------------------------------------ */

export const iplOverviewQuery = z.object({
  period: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  category: z
    .enum([
      "ALL",
      "TEPAT_WAKTU",
      "TERLAMBAT",
      "MENUNGGU",
      "NUNGGAK",
      "BELUM_JATUH_TEMPO",
    ])
    .default("ALL"),
});

export async function getIplOverview(
  query: z.infer<typeof iplOverviewQuery>,
): Promise<IplOverview> {
  const { value, year, month } = parsePeriod(query.period);
  const now = new Date();
  // Perkembangan Januari-Desember untuk tahun periode terpilih.
  const trendPeriods = Array.from({ length: 12 }, (_, index) => ({
    year,
    month: index + 1,
  }));

  const [bills, trendBills, residents] = await Promise.all([
    prisma.residentBill.findMany({
      where: { year, month },
      include: {
        user: {
          select: {
            email: true,
            citizenProfile: {
              select: { fullName: true, blockHouse: true, houseNumber: true },
            },
          },
        },
      },
    }),
    prisma.residentBill.findMany({
      where: {
        year,
      },
      select: {
        year: true,
        month: true,
        status: true,
        dueDate: true,
        paidAt: true,
      },
    }),
    prisma.citizenProfile.findMany({
      where: residentWhere,
      select: { userId: true, blockHouse: true, houseNumber: true },
    }),
  ]);

  const billedUserIds = new Set(bills.map((bill) => bill.userId));
  const houses = new Set<string>();
  const billedHouses = new Set<string>();
  for (const resident of residents) {
    const block = resident.blockHouse?.trim().toUpperCase();
    const number = resident.houseNumber?.trim().toUpperCase();
    if (!block || !number) continue;

    const house = JSON.stringify([block, number]);
    houses.add(house);
    if (billedUserIds.has(resident.userId)) billedHouses.add(house);
  }

  const breakdown = emptyBreakdown();
  const metrics = {
    billedAmount: 0,
    billedCount: bills.length,
    paidAmount: 0,
    paidCount: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    overdueCount: 0,
    onTimeRate: 0,
    residentCount: residents.length,
    unbilledCount: residents.filter(({ userId }) => !billedUserIds.has(userId))
      .length,
    houseCount: houses.size,
    billedHouseCount: billedHouses.size,
  };

  const rows: IplResidentRow[] = bills.map((bill) => {
    const category = categorizeBill(bill, now);
    const amount = Number(bill.amount);
    breakdown[category] += 1;
    metrics.billedAmount += amount;
    if (bill.status === "LUNAS") {
      metrics.paidAmount += amount;
      metrics.paidCount += 1;
    } else {
      metrics.unpaidAmount += amount;
      metrics.unpaidCount += 1;
    }
    if (category === "NUNGGAK") metrics.overdueCount += 1;
    return {
      billId: bill.id,
      userId: bill.userId,
      name: nameOf(bill.user),
      house: houseOf(bill.user.citizenProfile),
      amount,
      dueDate: bill.dueDate?.toISOString() ?? null,
      paidAt: bill.paidAt?.toISOString() ?? null,
      category,
    };
  });
  const assessedCount = bills.filter(
    (bill) =>
      bill.status === "LUNAS" || (bill.dueDate && endOfDay(bill.dueDate) < now),
  ).length;
  metrics.onTimeRate = assessedCount
    ? Math.round((breakdown.TEPAT_WAKTU / assessedCount) * 100)
    : 0;

  const trend: IplTrendPoint[] = trendPeriods.map(({ year: y, month: m }) => ({
    period: periodKey(y, m),
    label: new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
      month: "short",
    }),
    ...emptyBreakdown(),
  }));
  for (const bill of trendBills) {
    const point = trend.find(
      (item) => item.period === periodKey(bill.year, bill.month),
    );
    if (point) point[categorizeBill(bill, now)] += 1;
  }

  const filtered = (
    query.category === "ALL"
      ? rows
      : rows.filter((row) => row.category === query.category)
  ).sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.house.localeCompare(b.house, "id", { numeric: true }) ||
      a.name.localeCompare(b.name, "id"),
  );
  const start = (query.page - 1) * PAGE_SIZE;

  return {
    period: value,
    metrics,
    breakdown,
    trend,
    residents: filtered.slice(start, start + PAGE_SIZE),
    residentPagination: pagination(query.page, filtered.length),
  };
}

export async function getIplPayments(
  query: z.infer<typeof periodDayQuery>,
): Promise<IplPaymentList> {
  const range = rangeForPeriodDay(query.period, query.day);
  const where = {
    status: "LUNAS" as const,
    paidAt: range,
  };
  const [bills, aggregate] = await Promise.all([
    prisma.residentBill.findMany({
      where,
      orderBy: [{ paidAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            email: true,
            citizenProfile: {
              select: { fullName: true, blockHouse: true, houseNumber: true },
            },
          },
        },
        paymentOrders: {
          where: { status: "PAID" },
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { paymentType: true, paymentBank: true },
        },
      },
    }),
    prisma.residentBill.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    }),
  ]);
  return {
    rows: bills.map((bill) => {
      const order = bill.paymentOrders[0];
      return {
        billId: bill.id,
        paidAt: bill.paidAt!.toISOString(),
        name: nameOf(bill.user),
        house: houseOf(bill.user.citizenProfile),
        period: periodLabel(bill.year, bill.month, "long"),
        amount: Number(bill.amount),
        method:
          order?.paymentType ??
          (bill.paymentProofUrl ? "transfer_manual" : null),
        bank: order?.paymentBank ?? null,
        source: order ? "ONLINE" : "MANUAL",
      };
    }),
    totalAmount: Number(aggregate._sum.amount ?? 0),
    pagination: pagination(query.page, aggregate._count),
  };
}

export async function getIplReceipt(billId: string): Promise<IplReceipt> {
  const bill = await prisma.residentBill.findUnique({
    where: { id: billId },
    include: {
      user: {
        select: {
          email: true,
          citizenProfile: {
            select: { fullName: true, blockHouse: true, houseNumber: true },
          },
        },
      },
      paymentOrders: {
        where: { status: "PAID" },
        orderBy: { paidAt: "desc" },
        take: 1,
      },
    },
  });
  if (!bill) throw new PaymentError("Tagihan tidak ditemukan.", 404);
  const order = bill.paymentOrders[0];
  const amount = Number(bill.amount);
  const stamp = (bill.paidAt ?? bill.createdAt)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  return {
    billId: bill.id,
    receiptNumber: `IPL/${stamp}/${bill.id.replace(/-/g, "").slice(-6).toUpperCase()}`,
    name: nameOf(bill.user),
    email: bill.user.email,
    house: houseOf(bill.user.citizenProfile),
    period: periodLabel(bill.year, bill.month, "long"),
    title: bill.title,
    items: parseBillItems(bill.items, amount),
    amount,
    dueDate: bill.dueDate?.toISOString() ?? null,
    paidAt: bill.paidAt?.toISOString() ?? null,
    status: bill.status,
    method:
      order?.paymentType ?? (bill.paymentProofUrl ? "transfer_manual" : null),
    bank: order?.paymentBank ?? null,
    orderId: order?.id ?? null,
    gatewayTransactionId: order?.gatewayTransactionId ?? null,
    source: order ? "ONLINE" : "MANUAL",
  };
}

export async function getBillingResidents(
  period?: string,
): Promise<BillingResident[]> {
  const { year, month } = parsePeriod(period);
  const residents = await prisma.citizenProfile.findMany({
    where: residentWhere,
    select: {
      userId: true,
      fullName: true,
      blockHouse: true,
      houseNumber: true,
      user: {
        select: {
          residentBills: {
            where: { year, month },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  return residents
    .map((resident) => ({
      id: resident.userId,
      name: resident.fullName,
      house: houseOf(resident),
      hasBill: resident.user.residentBills.length > 0,
    }))
    .sort(
      (a, b) =>
        a.house.localeCompare(b.house, "id", { numeric: true }) ||
        a.name.localeCompare(b.name, "id"),
    );
}

export const assignIplSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  dueDate: z.coerce.date(),
  title: z.string().trim().max(120).optional(),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Nama rincian wajib diisi").max(60),
        amount: z.coerce
          .number()
          .int("Nominal harus bilangan bulat")
          .positive("Nominal harus lebih dari 0")
          .max(100_000_000),
      }),
    )
    .min(1, "Minimal satu rincian")
    .max(12),
  userIds: z.array(z.string().min(1)).max(1000).default([]),
});

export async function assignIplBills(
  input: z.infer<typeof assignIplSchema>,
): Promise<AssignIplResult> {
  const amount = input.items.reduce((sum, item) => sum + item.amount, 0);
  const residents = await prisma.citizenProfile.findMany({
    where: input.userIds.length
      ? { ...residentWhere, userId: { in: input.userIds } }
      : residentWhere,
    select: { userId: true },
  });
  if (!residents.length)
    throw new PaymentError("Tidak ada warga terverifikasi yang dipilih.", 400);

  const title =
    input.title || `IPL ${periodLabel(input.year, input.month, "long")}`;
  const { count } = await prisma.residentBill.createMany({
    data: residents.map((resident) => ({
      userId: resident.userId,
      title,
      month: input.month,
      year: input.year,
      amount: new Prisma.Decimal(amount),
      status: "BELUM_BAYAR" as const,
      dueDate: input.dueDate,
      items: input.items,
      notes: input.items.map((item) => item.label).join(", "),
    })),
    skipDuplicates: true,
  });
  return { created: count, skipped: residents.length - count };
}

/* ------------------------------------------------------------------ */
/* Kantong donasi                                                      */
/* ------------------------------------------------------------------ */

export const donationAdminQuery = periodDayQuery.extend({
  ledger: z.enum(["IN", "OUT"]).default("IN"),
});

export async function getDonationAdmin(
  query: z.infer<typeof donationAdminQuery>,
): Promise<DonationAdminOverview> {
  const { value, year, month } = parsePeriod(query.period);
  const monthRange = {
    gte: new Date(year, month - 1, 1),
    lt: new Date(year, month, 1),
  };
  const range = rangeForPeriodDay(value, query.day || undefined);
  const base = { fundType: "DONASI" as const, deletedAt: null };
  const outWhere = { ...base, type: "PENGELUARAN" as const };
  const inWhere = { ...base, type: "PEMASUKAN" as const };
  const ledger: DonationLedger = query.ledger;

  const [
    incomes,
    summary,
    monthIn,
    monthOut,
    outFilteredAgg,
    outRows,
    yearIncomes,
  ] = await Promise.all([
    getDonationIncomes(ledger === "IN" ? query.page : 1, PAGE_SIZE, {
      range,
      forAdmin: true,
    }),
    prisma.financeSummary.findUnique({ where: { fundType: "DONASI" } }),
    prisma.financialTransaction.aggregate({
      where: { ...inWhere, transactionDate: monthRange },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { ...outWhere, transactionDate: monthRange },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financialTransaction.aggregate({
      where: { ...outWhere, transactionDate: range },
      _sum: { amount: true },
      _count: true,
    }),
    ledger === "OUT"
      ? prisma.financialTransaction.findMany({
          where: { ...outWhere, transactionDate: range },
          orderBy: [{ transactionDate: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            recordedBy: {
              select: {
                email: true,
                citizenProfile: { select: { fullName: true } },
                agencyProfile: { select: { agencyName: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
    prisma.financialTransaction.findMany({
      where: {
        ...inWhere,
        transactionDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: { transactionDate: true, amount: true },
    }),
  ]);

  // Antusiasme donasi: jumlah donasi & nominal per bulan sepanjang tahun periode.
  const trend = Array.from({ length: 12 }, (_, index) => ({
    period: periodKey(year, index + 1),
    label: new Date(year, index, 1).toLocaleDateString("id-ID", {
      month: "short",
    }),
    count: 0,
    amount: 0,
  }));
  for (const row of yearIncomes) {
    const point = trend[row.transactionDate.getMonth()];
    point.count += 1;
    point.amount += Number(row.amount);
  }

  return {
    period: value,
    year,
    totals: {
      balance: Number(summary?.balance ?? 0),
      periodIn: Number(monthIn._sum.amount ?? 0),
      periodInCount: monthIn._count,
      periodOut: Number(monthOut._sum.amount ?? 0),
      periodOutCount: monthOut._count,
    },
    trend,
    ledger,
    inRows:
      ledger === "IN"
        ? incomes.items.map((item) => ({
            id: item.id,
            date: item.date,
            donorName: item.donorName,
            anonymous: item.anonymous,
            realName: item.realName ?? null,
            message: item.message,
            amount: item.amount,
            method: item.paymentType ?? null,
            bank: item.paymentBank ?? null,
          }))
        : [],
    outRows: outRows.map((row) => ({
      id: row.id,
      date: row.transactionDate.toISOString(),
      title: row.title,
      category: row.category,
      description: row.description,
      amount: Number(row.amount),
      proofUrl: row.proofUrl,
      admin:
        row.recordedBy?.agencyProfile?.agencyName ||
        row.recordedBy?.citizenProfile?.fullName ||
        row.recordedBy?.email.split("@")[0] ||
        "Pengurus",
    })),
    filteredAmount:
      ledger === "IN"
        ? incomes.filtered.amount
        : Number(outFilteredAgg._sum.amount ?? 0),
    pagination:
      ledger === "IN"
        ? incomes.pagination
        : pagination(query.page, outFilteredAgg._count),
  };
}
