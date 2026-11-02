import prisma from "@/lib/prisma";
import {
  BillStatus,
  FundType,
  Role,
  TransactionType,
} from "@/generated/prisma/enums";
import type {
  BillQueryInput,
  CreateDonationInput,
  CreateExpenseInput,
  GenerateBillsInput,
  PayBillInput,
  TransactionQueryInput,
} from "./finance-schema";
import type {
  KpiCardsSummary,
  PaginatedBillsResult,
  PaginatedTransactionsResult,
  ResidentBillItem,
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

/**
 * Records an incoming community donation into the DONASI fund.
 * Atomically creates a PEMASUKAN transaction and increments the DONASI balance in FinanceSummary.
 */
export async function recordDonation(
  donorUserId: string | null,
  input: CreateDonationInput,
): Promise<TransactionListItem> {
  const amountDecimal = new Prisma.Decimal(input.amount);
  const donorLabel = input.isAnonymous
    ? "Hamba Allah"
    : input.donorName?.trim() || "Warga";

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.financialTransaction.create({
      data: {
        title: `Donasi Kas Perumahan - ${donorLabel}`,
        description:
          input.description || `Donasi untuk kas perumahan dari ${donorLabel}`,
        amount: amountDecimal,
        type: TransactionType.PEMASUKAN,
        fundType: FundType.DONASI,
        category: "Donasi Warga",
        proofUrl: input.proofUrl,
        transactionDate: new Date(),
        recordedById: donorUserId,
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

    await tx.financeSummary.upsert({
      where: { fundType: FundType.DONASI },
      update: {
        balance: { increment: amountDecimal },
        totalIncome: { increment: amountDecimal },
      },
      create: {
        fundType: FundType.DONASI,
        balance: amountDecimal,
        totalIncome: amountDecimal,
        totalExpense: new Prisma.Decimal(0),
      },
    });

    let authorName = donorLabel;
    if (transaction.recordedBy) {
      authorName =
        transaction.recordedBy.citizenProfile?.fullName ||
        transaction.recordedBy.agencyProfile?.agencyName ||
        transaction.recordedBy.email.split("@")[0] ||
        donorLabel;
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

/**
 * Retrieves resident bills with role-based access control:
 * - ADMIN can view all resident bills, with filters for status, month, year, or citizen search.
 * - WARGA can only view their own bills.
 * - DEVELOPER cannot view private citizen bills (returns empty).
 */
export async function getResidentBills(
  viewer: { userId: string; role: Role },
  query: BillQueryInput,
): Promise<PaginatedBillsResult> {
  const { status, month, year, search, page = 1, limit = 20 } = query;
  const whereClause: Prisma.ResidentBillWhereInput = {};

  if (viewer.role === Role.WARGA) {
    whereClause.userId = viewer.userId;
  } else if (viewer.role === Role.DEVELOPER) {
    return {
      bills: [],
      pagination: { total: 0, page, limit, totalPages: 1 },
    };
  }

  if (status) {
    const s = status.trim().toUpperCase();
    if (s === "LUNAS") whereClause.status = BillStatus.LUNAS;
    else if (s === "BELUM_BAYAR") whereClause.status = BillStatus.BELUM_BAYAR;
    else if (s === "MENUNGGU_VERIFIKASI")
      whereClause.status = BillStatus.MENUNGGU_VERIFIKASI;
  }

  if (month) whereClause.month = month;
  if (year) whereClause.year = year;

  if (search && viewer.role === Role.ADMIN) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      {
        user: {
          citizenProfile: {
            fullName: { contains: search, mode: "insensitive" },
          },
        },
      },
    ];
  } else if (search) {
    whereClause.title = { contains: search, mode: "insensitive" };
  }

  const skip = (page - 1) * limit;

  const [total, bills] = await Promise.all([
    prisma.residentBill.count({ where: whereClause }),
    prisma.residentBill.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            citizenProfile: {
              select: {
                fullName: true,
                blockHouse: true,
                houseNumber: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const items: ResidentBillItem[] = bills.map((b) => ({
    id: b.id,
    userId: b.userId,
    title: b.title,
    month: b.month,
    year: b.year,
    amount: Number(b.amount),
    status: b.status,
    dueDate: b.dueDate ? b.dueDate.toISOString() : null,
    paidAt: b.paidAt ? b.paidAt.toISOString() : null,
    paymentProofUrl: b.paymentProofUrl,
    notes: b.notes,
    createdAt: b.createdAt.toISOString(),
    residentName: b.user?.citizenProfile?.fullName || undefined,
    blockHouse: b.user?.citizenProfile?.blockHouse || null,
    houseNumber: b.user?.citizenProfile?.houseNumber || null,
  }));

  return {
    bills: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Admin action to batch-generate monthly IPL bills for all verified citizens.
 */
export async function generateMonthlyBills(
  adminId: string,
  input: GenerateBillsInput,
): Promise<{ generatedCount: number; message: string }> {
  void adminId;
  const { month, year, amount, title, dueDate } = input;
  const billTitle = title || `Iuran IPL ${month}/${year}`;
  const amountDecimal = new Prisma.Decimal(amount);

  const citizens = await prisma.citizenProfile.findMany({
    where: { isVerified: true },
    select: { userId: true },
  });

  if (citizens.length === 0) {
    return {
      generatedCount: 0,
      message:
        "Tidak ada warga terverifikasi yang ditemukan untuk dibuatkan tagihan.",
    };
  }

  let generatedCount = 0;

  for (const citizen of citizens) {
    const existing = await prisma.residentBill.findUnique({
      where: {
        userId_month_year: {
          userId: citizen.userId,
          month,
          year,
        },
      },
    });

    if (!existing) {
      await prisma.residentBill.create({
        data: {
          userId: citizen.userId,
          title: billTitle,
          month,
          year,
          amount: amountDecimal,
          status: BillStatus.BELUM_BAYAR,
          dueDate: dueDate || new Date(year, month - 1, 15),
        },
      });
      generatedCount++;
    }
  }

  return {
    generatedCount,
    message: `Berhasil menerbitkan ${generatedCount} tagihan iuran IPL untuk periode ${month}/${year}.`,
  };
}

/**
 * Citizen action to submit proof of payment for their IPL bill.
 */
export async function payResidentBill(
  userId: string,
  billId: string,
  input: PayBillInput,
): Promise<ResidentBillItem> {
  const bill = await prisma.residentBill.findUnique({
    where: { id: billId },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  if (bill.userId !== userId) {
    throw new Error("Anda tidak memiliki akses ke tagihan ini");
  }

  if (bill.status === BillStatus.LUNAS) {
    throw new Error("Tagihan ini sudah lunas");
  }

  const updated = await prisma.residentBill.update({
    where: { id: billId },
    data: {
      status: BillStatus.MENUNGGU_VERIFIKASI,
      paymentProofUrl: input.paymentProofUrl,
      notes: input.notes,
    },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    month: updated.month,
    year: updated.year,
    amount: Number(updated.amount),
    status: updated.status,
    dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
    paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    paymentProofUrl: updated.paymentProofUrl,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
  };
}

/**
 * Admin action to verify a resident's bill payment.
 * Atomically marks the bill as LUNAS, records an incoming transaction (PEMASUKAN, IPL),
 * and increments the IPL balance in FinanceSummary.
 */
export async function verifyResidentBill(
  adminId: string,
  billId: string,
): Promise<ResidentBillItem> {
  const bill = await prisma.residentBill.findUnique({
    where: { id: billId },
    include: {
      user: {
        select: {
          citizenProfile: { select: { fullName: true } },
        },
      },
    },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  if (bill.status === BillStatus.LUNAS) {
    throw new Error("Tagihan ini sudah lunas sebelumnya");
  }

  const citizenName = bill.user?.citizenProfile?.fullName || "Warga";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.residentBill.update({
      where: { id: billId },
      data: {
        status: BillStatus.LUNAS,
        paidAt: new Date(),
      },
    });

    await tx.financialTransaction.create({
      data: {
        title: `Pembayaran ${bill.title} (${citizenName})`,
        description: `Penerimaan iuran warga ${citizenName} untuk periode ${bill.month}/${bill.year}`,
        amount: bill.amount,
        type: TransactionType.PEMASUKAN,
        fundType: FundType.IPL,
        category: "Iuran IPL Warga",
        proofUrl: bill.paymentProofUrl,
        transactionDate: new Date(),
        recordedById: adminId,
        residentBillId: bill.id,
      },
    });

    await tx.financeSummary.upsert({
      where: { fundType: FundType.IPL },
      update: {
        balance: { increment: bill.amount },
        totalIncome: { increment: bill.amount },
      },
      create: {
        fundType: FundType.IPL,
        balance: bill.amount,
        totalIncome: bill.amount,
        totalExpense: new Prisma.Decimal(0),
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      month: updated.month,
      year: updated.year,
      amount: Number(updated.amount),
      status: updated.status,
      dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      paymentProofUrl: updated.paymentProofUrl,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      residentName: citizenName,
    };
  });
}

/**
 * Admin action to reject an invalid payment proof.
 * Resets the bill status back to BELUM_BAYAR with explanation notes.
 */
export async function rejectResidentBill(
  adminId: string,
  billId: string,
  reason?: string,
): Promise<ResidentBillItem> {
  void adminId;
  const bill = await prisma.residentBill.findUnique({
    where: { id: billId },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  if (bill.status === BillStatus.LUNAS) {
    throw new Error("Tagihan yang sudah lunas tidak dapat ditolak");
  }

  const updated = await prisma.residentBill.update({
    where: { id: billId },
    data: {
      status: BillStatus.BELUM_BAYAR,
      notes: reason
        ? `Bukti pembayaran ditolak: ${reason}`
        : "Bukti pembayaran ditolak oleh pengurus.",
    },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    month: updated.month,
    year: updated.year,
    amount: Number(updated.amount),
    status: updated.status,
    dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
    paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    paymentProofUrl: updated.paymentProofUrl,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
  };
}
