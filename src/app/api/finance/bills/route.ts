import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { billQuerySchema } from "@/services/finance/finance-schema";
import { getResidentBills } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/finance/bills:
 *   get:
 *     summary: Ambil daftar tagihan iuran warga (IPL)
 *     description: Mengambil daftar tagihan bulanan warga. Warga hanya dapat melihat tagihan miliknya sendiri, Admin dapat melihat seluruh tagihan warga perumahan, sedangkan Developer tidak memiliki akses ke data tagihan warga.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [BELUM_BAYAR, LUNAS, MENUNGGU_VERIFIKASI]
 *         description: Filter status pembayaran tagihan
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Bulan tagihan (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Tahun tagihan
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Pencarian nama warga (khusus Admin) atau judul tagihan
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
 *         description: Daftar tagihan berhasil diambil
 *       401:
 *         description: Belum login / token tidak valid
 *       500:
 *         description: Terjadi kesalahan pada server
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access: Please login first" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = billQuerySchema.safeParse({
      status: searchParams.get("status") || undefined,
      month: searchParams.get("month") || undefined,
      year: searchParams.get("year") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsedQuery.success) {
      return badRequest(
        "Parameter query tagihan tidak valid",
        z.treeifyError(parsedQuery.error),
      );
    }

    const result = await getResidentBills(
      { userId: authUser.userId, role: authUser.role },
      parsedQuery.data,
    );

    return ok("Daftar tagihan warga berhasil diambil", { data: result });
  } catch (error: unknown) {
    console.error("[FINANCE_BILLS_GET]", error);
    return internalError("Terjadi kesalahan saat mengambil daftar tagihan.");
  }
}
