import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import {
  createExpenseSchema,
  transactionQuerySchema,
} from "@/services/finance/finance-schema";
import {
  createExpenseReport,
  getFinanceTransactions,
} from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/finance/transactions:
 *   get:
 *     summary: Ambil daftar transaksi keuangan untuk tabel transparansi warga
 *     description: Mengambil daftar transaksi pemasukan dan pengeluaran kas perumahan yang dapat difilter berdasarkan jenis dana (IPL atau DONASI), jenis transaksi, kategori, atau pencarian teks. Terbuka untuk seluruh warga (WARGA), Admin, dan Developer tanpa mengekspos data pribadi sensitif.
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: fundType
 *         schema:
 *           type: string
 *           enum: [IPL, DONASI, ALL]
 *         description: Filter berdasarkan jenis dana kas
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PEMASUKAN, PENGELUARAN, ALL]
 *         description: Filter berdasarkan jenis transaksi
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Kata kunci pencarian judul atau deskripsi
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter berdasarkan kategori
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Daftar transaksi berhasil diambil
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = transactionQuerySchema.parse({
      fundType: searchParams.get("fundType") || undefined,
      type: searchParams.get("type") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || searchParams.get("q") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    const result = await getFinanceTransactions(query);

    return ok("Finance transactions retrieved successfully", {
      data: {
        transactions: result.transactions,
        items: result.transactions,
        pagination: result.pagination,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return badRequest("Parameter query tidak valid", z.treeifyError(error));
    }
    console.error("[FINANCE_TRANSACTIONS_GET]", error);
    return internalError(
      "An error occurred while fetching finance transactions.",
    );
  }
}

/**
 * @swagger
 * /api/finance/transactions:
 *   post:
 *     summary: Input laporan pengeluaran baru (Khusus Admin)
 *     description: Mencatat transaksi pengeluaran baru untuk kas IPL atau Donasi beserta nominal positif, kategori, deskripsi, dan bukti kuitansi. Saldo kas terkait akan otomatis dipotong secara realtime.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - fundType
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Pembelian Lampu Jalan Blok C
 *               description:
 *                 type: string
 *                 example: Penggantian 5 unit lampu LED penerangan jalan lingkungan RT 02
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 350000
 *               fundType:
 *                 type: string
 *                 enum: [IPL, DONASI]
 *                 example: IPL
 *               category:
 *                 type: string
 *                 example: Fasilitas Lingkungan
 *               proofUrl:
 *                 type: string
 *                 example: https://minio.local/receipts/lampu-jalan.jpg
 *               transactionDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Laporan pengeluaran berhasil dicatat
 *       400:
 *         description: Validasi input gagal atau nominal tidak valid
 *       401:
 *         description: Unauthorized - Token tidak valid atau belum login
 *       403:
 *         description: Forbidden - Role tidak memiliki izin (Hanya ADMIN yang diizinkan)
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access: Please login first" },
        { status: 401 },
      );
    }

    // Explicit developer & resident restriction
    if (authUser.role === Role.DEVELOPER) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Role DEVELOPER tidak memiliki wewenang untuk menginput laporan pengeluaran keuangan.",
        },
        { status: 403 },
      );
    }

    if (authUser.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Hanya role ADMIN yang memiliki izin untuk menginput laporan pengeluaran baru.",
        },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    const validation = createExpenseSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(
        "Validasi input laporan pengeluaran gagal",
        z.treeifyError(validation.error),
      );
    }

    const transaction = await createExpenseReport(
      authUser.userId,
      validation.data,
    );

    return created("Laporan pengeluaran berhasil dicatat", {
      data: transaction,
    });
  } catch (error: unknown) {
    console.error("[FINANCE_EXPENSE_POST]", error);
    return internalError("An error occurred while creating expense report.");
  }
}
