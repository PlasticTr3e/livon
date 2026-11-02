import prisma from "@/lib/prisma";
import { FundType, TransactionType } from "@/generated/prisma/enums";
import type {
  CreateExpenseInput,
  TransactionQueryInput,
} from "./finance-schema";
import type {
  KpiCardsSummary,
  PaginatedTransactionsResult,
  ResidentBillSummary,
  TransactionListItem,
} from "./finance-types";
import { Prisma } from "@/generated/prisma/client";

/**
 * Retrieves the 4 realtime KPI Cards:
 * 1. Saldo Kas IPL
 * 2. Saldo Kas Donasi
 * 3. Total Pengeluaran Bulan Ini
 * 4. Status Tagihan Warga yang sedang login
 */
export async function getFinanceSummary(
  userId?: string,
): Promise<KpiCardsSummary> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(
    currentYear,
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  // 1. Fetch Realtime Fund Balances
  const summaries = await prisma.financeSummary.findMany({
    where: {
      fundType: { in: [FundType.IPL, FundType.DONASI] },
    },
  });

  const iplRecord = summaries.find((s) => s.fundType === FundType.IPL);
  const donationRecord = summaries.find((s) => s.fundType === FundType.DONASI);

  const iplBalance = iplRecord ? Number(iplRecord.balance) : 0;
  const donationBalance = donationRecord ? Number(donationRecord.balance) : 0;

  // 2. Fetch Total Monthly Expenses (Pengeluaran Bulan Ini)
  const monthlyExpenseAgg = await prisma.financialTransaction.aggregate({
    _sum: { amount: true },
    where: {
      type: TransactionType.PENGELUARAN,
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      deletedAt: null,
    },
  });

  const monthlyExpense = monthlyExpenseAgg._sum.amount
    ? Number(monthlyExpenseAgg._sum.amount)
    : 0;

  // 3. Fetch Monthly Income for additional overview
  const monthlyIncomeAgg = await prisma.financialTransaction.aggregate({
    _sum: { amount: true },
    where: {
      type: TransactionType.PEMASUKAN,
      transactionDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      deletedAt: null,
    },
  });

  const monthlyIncome = monthlyIncomeAgg._sum.amount
    ? Number(monthlyIncomeAgg._sum.amount)
    : 0;

  // 4. Fetch Active Citizen Bill Status for the logged-in user
  let residentBill: ResidentBillSummary | null = null;

  if (userId) {
    // If the user has WARGA role or is checking their own bill
    const activeBill = await prisma.residentBill.findFirst({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
      },
      orderBy: { createdAt: "desc" },
    });

    const bill =
      activeBill ||
      (await prisma.residentBill.findFirst({
        where: { userId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }));

    if (bill) {
      residentBill = {
        id: bill.id,
        title: bill.title,
        month: bill.month,
        year: bill.year,
        amount: Number(bill.amount),
        status: bill.status,
        dueDate: bill.dueDate ? bill.dueDate.toISOString() : null,
        paidAt: bill.paidAt ? bill.paidAt.toISOString() : null,
        notes: bill.notes,
      };
    }
  }

  return {
    iplBalance,
    donationBalance,
    monthlyExpense,
    residentBill,
    saldoIpl: iplBalance,
    saldoDonasi: donationBalance,
    pengeluaranBulanIni: monthlyExpense,
    statusTagihan: residentBill,
    overview: {
      totalIncomeThisMonth: monthlyIncome,
      totalExpenseThisMonth: monthlyExpense,
      activeMonth: currentMonth,
      activeYear: currentYear,
    },
  };
}

/**
 * Retrieves paginated financial transactions for citizen transparency table
 * Supports filtering by ?type=IPL or ?type=DONATION (or ?fundType=IPL/DONASI),
 * transaction type (PEMASUKAN / PENGELUARAN), search, category, and dates.
 */
export async function getFinanceTransactions(
  query: TransactionQueryInput,
): Promise<PaginatedTransactionsResult> {
  const { fundType, type, category, search, startDate, endDate, page, limit } =
    query;

  const whereClause: Prisma.FinancialTransactionWhereInput = {
    deletedAt: null,
  };

  const rawType = (type || "").trim().toUpperCase();
  const rawFundType = (fundType || "").trim().toUpperCase();

  let resolvedFundType: FundType | undefined;
  let resolvedTransactionType: TransactionType | undefined;

  // 1. Resolve fund type filter (IPL vs DONATION/DONASI)
  if (rawType === "IPL" || rawFundType === "IPL") {
    resolvedFundType = FundType.IPL;
  } else if (
    rawType === "DONATION" ||
    rawType === "DONASI" ||
    rawFundType === "DONATION" ||
    rawFundType === "DONASI"
  ) {
    resolvedFundType = FundType.DONASI;
  }

  // 2. Resolve transaction type filter (PEMASUKAN vs PENGELUARAN)
  if (rawType === "PEMASUKAN" || rawType === "INCOME") {
    resolvedTransactionType = TransactionType.PEMASUKAN;
  } else if (rawType === "PENGELUARAN" || rawType === "EXPENSE") {
    resolvedTransactionType = TransactionType.PENGELUARAN;
  }

  if (resolvedFundType) {
    whereClause.fundType = resolvedFundType;
  }

  if (resolvedTransactionType) {
    whereClause.type = resolvedTransactionType;
  }

  if (category) {
    whereClause.category = {
      contains: category,
      mode: "insensitive",
    };
  }

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  if (startDate || endDate) {
    whereClause.transactionDate = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const skip = (page - 1) * limit;

  const [total, transactions] = await Promise.all([
    prisma.financialTransaction.count({ where: whereClause }),
    prisma.financialTransaction.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { transactionDate: "desc" },
      include: {
        recordedBy: {
          select: {
            id: true,
            email: true,
            citizenProfile: { select: { fullName: true } },
            agencyProfile: { select: { agencyName: true } },
          },
        },
      },
    }),
  ]);

  const items: TransactionListItem[] = transactions.map((t) => {
    let authorName = "Pengurus";
    if (t.recordedBy) {
      authorName =
        t.recordedBy.citizenProfile?.fullName ||
        t.recordedBy.agencyProfile?.agencyName ||
        t.recordedBy.email.split("@")[0] ||
        "Pengurus";
    }

    return {
      id: t.id,
      title: t.title,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      fundType: t.fundType,
      category: t.category,
      proofUrl: t.proofUrl,
      transactionDate: t.transactionDate.toISOString(),
      recordedBy: t.recordedBy
        ? {
            id: t.recordedBy.id,
            name: authorName,
          }
        : null,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return {
    transactions: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Creates a new expense report in an atomic database transaction.
 * Deducts the amount from the respective FinanceSummary balance and increments totalExpense.
 */
export async function createExpenseReport(
  adminId: string,
  input: CreateExpenseInput,
): Promise<TransactionListItem> {
  const date = input.transactionDate || new Date();
  const amountDecimal = new Prisma.Decimal(input.amount);

  return prisma.$transaction(async (tx) => {
    // 1. Create the financial expense transaction
    const transaction = await tx.financialTransaction.create({
      data: {
        title: input.title,
        description: input.description,
        amount: amountDecimal,
        type: TransactionType.PENGELUARAN,
        fundType: input.fundType,
        category: input.category,
        proofUrl: input.proofUrl,
        transactionDate: date,
        recordedById: adminId,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            email: true,
            citizenProfile: { select: { fullName: true } },
            agencyProfile: { select: { agencyName: true } },
          },
        },
      },
    });

    // 2. Atomically update the respective fund balance in FinanceSummary
    await tx.financeSummary.upsert({
      where: { fundType: input.fundType },
      update: {
        balance: { decrement: amountDecimal },
        totalExpense: { increment: amountDecimal },
      },
      create: {
        fundType: input.fundType,
        balance: new Prisma.Decimal(-input.amount),
        totalIncome: new Prisma.Decimal(0),
        totalExpense: amountDecimal,
      },
    });

    let authorName = "Admin";
    if (transaction.recordedBy) {
      authorName =
        transaction.recordedBy.citizenProfile?.fullName ||
        transaction.recordedBy.agencyProfile?.agencyName ||
        transaction.recordedBy.email.split("@")[0] ||
        "Admin";
    }

    return {
      id: transaction.id,
      title: transaction.title,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      fundType: transaction.fundType,
      category: transaction.category,
      proofUrl: transaction.proofUrl,
      transactionDate: transaction.transactionDate.toISOString(),
      recordedBy: transaction.recordedBy
        ? {
            id: transaction.recordedBy.id,
            name: authorName,
          }
        : null,
      createdAt: transaction.createdAt.toISOString(),
    };
  });
}
