import { canManage } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import type { AuthPayload } from "@/lib/auth";
import {
  getFinanceSummary,
  getFinanceTransactions,
  getResidentBills,
} from "./finance-service";
import { paymentRecord } from "./payment-service";
import { getDonationIncomes } from "./donation-feed";
import { z } from "zod";
import type { ResidentBillItem } from "@/lib/finance/finance-types";
import { parseBillItems } from "@/lib/finance/bill-items";

const page = z.coerce.number().int().positive().default(1);
export const financeHubQuery = z.object({
  billPage: page,
  expensePage: page,
  orderPage: page,
  incomePage: page,
  managementPage: page,
  expenseFund: z.enum(["ALL", "IPL", "DONASI"]).default("ALL"),
  orderFund: z.enum(["ALL", "IPL", "DONASI"]).default("ALL"),
  billId: z.string().uuid().optional(),
});
// Rows per page for every list on Billing & Care (bills, ledger, history).
const limit = 10;

/**
 * Bills that drive the IPL summary card. Independent of the history page the
 * resident is viewing: every unpaid bill (oldest due first) plus the latest bill.
 */
async function getSummaryBills(userId: string): Promise<ResidentBillItem[]> {
  const [open, latest] = await Promise.all([
    prisma.residentBill.findMany({
      where: { userId, status: { not: "LUNAS" } },
      orderBy: [{ dueDate: "asc" }, { year: "asc" }, { month: "asc" }],
      take: 24,
    }),
    prisma.residentBill.findFirst({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);
  const rows = [...open];
  if (latest && !rows.some((bill) => bill.id === latest.id)) rows.push(latest);
  return rows.map((bill) => ({
    id: bill.id,
    userId: bill.userId,
    title: bill.title,
    month: bill.month,
    year: bill.year,
    amount: Number(bill.amount),
    status: bill.status,
    dueDate: bill.dueDate?.toISOString() ?? null,
    paidAt: bill.paidAt?.toISOString() ?? null,
    paymentProofUrl: bill.paymentProofUrl,
    notes: bill.notes,
    items: parseBillItems(bill.items, Number(bill.amount)),
    createdAt: bill.createdAt.toISOString(),
  }));
}

export async function getFinanceHub(
  user: AuthPayload,
  query = financeHubQuery.parse({}),
) {
  const orderWhere = {
    userId: user.userId,
    ...(query.orderFund === "ALL" ? {} : { fundType: query.orderFund }),
  };
  const [
    summary,
    bills,
    expenses,
    orders,
    donations,
    profile,
    managementBills,
    orderCount,
    outstanding,
    selectedBill,
    donationSpent,
    donationIncomes,
    payable,
    summaryBills,
  ] = await Promise.all([
    getFinanceSummary(user.userId),
    getResidentBills(
      { userId: user.userId, role: "WARGA" },
      { page: query.billPage, limit },
    ),
    getFinanceTransactions({
      page: query.expensePage,
      limit,
      type: "PENGELUARAN",
      fundType: query.expenseFund === "ALL" ? undefined : query.expenseFund,
    }),
    prisma.paymentOrder.findMany({
      where: orderWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (query.orderPage - 1) * limit,
      take: limit,
    }),
    prisma.paymentOrder.aggregate({
      where: { fundType: "DONASI", status: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        citizenProfile: { select: { blockHouse: true, houseNumber: true } },
      },
    }),
    canManage(user.role)
      ? getResidentBills(user, { page: query.managementPage, limit })
      : null,
    prisma.paymentOrder.count({ where: orderWhere }),
    prisma.residentBill.aggregate({
      where: { userId: user.userId, status: { not: "LUNAS" } },
      _sum: { amount: true },
      _count: true,
    }),
    query.billId
      ? prisma.residentBill.findFirst({
          where: { id: query.billId, userId: user.userId },
        })
      : null,
    prisma.financialTransaction.aggregate({
      where: { fundType: "DONASI", type: "PENGELUARAN", deletedAt: null },
      _sum: { amount: true },
      _count: true,
    }),
    getDonationIncomes(query.incomePage, limit),
    prisma.residentBill.aggregate({
      where: { userId: user.userId, status: "BELUM_BAYAR" },
      _sum: { amount: true },
      _count: true,
    }),
    getSummaryBills(user.userId),
  ]);
  return {
    summary,
    bills: bills.bills,
    summaryBills,
    billPagination: bills.pagination,
    expenses: expenses.transactions,
    expensePagination: expenses.pagination,
    orders: orders.map((order) => paymentRecord(order)),
    orderPagination: {
      page: query.orderPage,
      total: orderCount,
      totalPages: Math.max(1, Math.ceil(orderCount / limit)),
    },
    outstanding: {
      amount: Number(outstanding._sum.amount ?? 0),
      count: outstanding._count,
    },
    /** Tagihan yang masih harus dibayar warga (tanpa yang menunggu verifikasi). */
    payable: {
      amount: Number(payable._sum.amount ?? 0),
      count: payable._count,
    },
    selectedBill: selectedBill
      ? {
          ...selectedBill,
          amount: Number(selectedBill.amount),
          items: parseBillItems(
            selectedBill.items,
            Number(selectedBill.amount),
          ),
          dueDate: selectedBill.dueDate?.toISOString() ?? null,
          paidAt: selectedBill.paidAt?.toISOString() ?? null,
          createdAt: selectedBill.createdAt.toISOString(),
          updatedAt: selectedBill.updatedAt.toISOString(),
        }
      : null,
    donationCount: donations._count,
    donationIncomes: donationIncomes.items,
    donationIncomeTotal: donationIncomes.total,
    donationIncomeThisMonth: donationIncomes.thisMonth,
    donationIncomePagination: donationIncomes.pagination,
    donationSpent: {
      amount: Number(donationSpent._sum.amount ?? 0),
      count: donationSpent._count,
    },
    donationIncome: Number(donations._sum.amount ?? 0),
    residence: [
      profile?.citizenProfile?.blockHouse,
      profile?.citizenProfile?.houseNumber,
    ]
      .filter(Boolean)
      .join(" "),
    managementBills: managementBills?.bills ?? [],
    managementPagination: managementBills?.pagination ?? {
      page: 1,
      total: 0,
      totalPages: 1,
    },
    isAgency: canManage(user.role),
    updatedAt: new Date().toISOString(),
  };
}
