import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { created, badRequest, internalError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import { generateBillsSchema } from "@/services/finance/finance-schema";
import { generateMonthlyBills } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/finance/bills/generate:
 *   post:
 *     summary: Terbitkan tagihan iuran bulanan warga secara serentak (Khusus Admin)
 *     description: Menerbitkan tagihan iuran IPL serentak untuk seluruh warga yang terverifikasi pada periode bulan dan tahun yang ditentukan.
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
 *               - month
 *               - year
 *               - amount
 *             properties:
 *               month:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 example: 11
 *               year:
 *                 type: integer
 *                 example: 2026
 *               amount:
 *                 type: number
 *                 example: 150000
 *               title:
 *                 type: string
 *                 example: Iuran IPL November 2026
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tagihan warga berhasil diterbitkan
 *       400:
 *         description: Validasi input gagal
 *       401:
 *         description: Belum login
 *       403:
 *         description: Forbidden - Hanya Admin yang berhak menerbitkan tagihan
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

    if (authUser.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Hanya role ADMIN yang memiliki izin untuk menerbitkan tagihan iuran warga.",
        },
        { status: 403 },
      );
    }

    const body: unknown = await req.json();
    const validation = generateBillsSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(
        "Validasi input penerbitan tagihan gagal",
        z.treeifyError(validation.error),
      );
    }

    const result = await generateMonthlyBills(authUser.userId, validation.data);

    return created(result.message, { data: result });
  } catch (error: unknown) {
    console.error("[FINANCE_BILLS_GENERATE_POST]", error);
    return internalError(
      "Terjadi kesalahan saat menerbitkan tagihan iuran warga.",
    );
  }
}
