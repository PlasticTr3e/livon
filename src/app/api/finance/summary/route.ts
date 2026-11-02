import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ok, internalError } from "@/lib/api-response";
import { getFinanceSummary } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/finance/summary:
 *   get:
 *     summary: Ambil data ringkasan 4 KPI Card keuangan secara realtime
 *     description: Mengembalikan 4 KPI Card realtime (Saldo Kas IPL, Saldo Kas Donasi, Total Pengeluaran Bulan Ini, dan Status Tagihan Warga yang login). Jika diakses tanpa login atau oleh admin, status tagihan menampilkan ringkasan umum.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ringkasan keuangan berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Finance KPI summary fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     iplBalance:
 *                       type: number
 *                       example: 15500000
 *                     donationBalance:
 *                       type: number
 *                       example: 8750000
 *                     monthlyExpense:
 *                       type: number
 *                       example: 3200000
 *                     residentBill:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                           example: Iuran IPL November 2026
 *                         month:
 *                           type: integer
 *                           example: 11
 *                         year:
 *                           type: integer
 *                           example: 2026
 *                         amount:
 *                           type: number
 *                           example: 150000
 *                         status:
 *                           type: string
 *                           enum: [BELUM_BAYAR, LUNAS, MENUNGGU_VERIFIKASI]
 *                           example: BELUM_BAYAR
 *                         dueDate:
 *                           type: string
 *                           nullable: true
 *                         paidAt:
 *                           type: string
 *                           nullable: true
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const summary = await getFinanceSummary(authUser?.userId);

    return ok("Finance KPI summary fetched successfully", { data: summary });
  } catch (error: unknown) {
    console.error("[FINANCE_SUMMARY_GET]", error);
    return internalError("An error occurred while fetching finance summary.");
  }
}
