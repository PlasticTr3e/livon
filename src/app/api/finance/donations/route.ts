import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { created, badRequest, internalError } from "@/lib/api-response";
import { createDonationSchema } from "@/services/finance/finance-schema";
import { recordDonation } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/finance/donations:
 *   post:
 *     summary: Catat donasi masuk ke kas donasi perumahan
 *     description: Menerima donasi dari warga atau masyarakat umum untuk kas donasi perumahan. Otomatis mencatat transaksi pemasukan (PEMASUKAN, DONASI) dan memperbarui saldo kas donasi secara realtime.
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1000
 *                 example: 100000
 *               donorName:
 *                 type: string
 *                 example: Bapak Haji Ahmad
 *               description:
 *                 type: string
 *                 example: Donasi perbaikan mushola dan taman warga
 *               proofUrl:
 *                 type: string
 *                 example: https://minio.local/receipts/transfer-donasi.jpg
 *               isAnonymous:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Donasi berhasil dicatat dan saldo kas donasi bertambah
 *       400:
 *         description: Validasi nominal atau input donasi gagal
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const body: unknown = await req.json();

    const validation = createDonationSchema.safeParse(body);
    if (!validation.success) {
      return badRequest(
        "Validasi input donasi gagal",
        z.treeifyError(validation.error),
      );
    }

    const transaction = await recordDonation(
      authUser?.userId || null,
      validation.data,
    );

    return created("Donasi berhasil dicatat dan saldo telah diperbarui", {
      data: transaction,
    });
  } catch (error: unknown) {
    console.error("[FINANCE_DONATION_POST]", error);
    return internalError("Terjadi kesalahan saat memproses donasi.");
  }
}
