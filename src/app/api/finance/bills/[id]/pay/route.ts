import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { payBillSchema } from "@/services/finance/finance-schema";
import { payResidentBill } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/finance/bills/{id}/pay:
 *   post:
 *     summary: Bayar tagihan iuran bulanan dengan melampirkan bukti transfer (Khusus Warga)
 *     description: Mengirimkan bukti transfer pembayaran tagihan iuran IPL. Status tagihan akan berubah menjadi MENUNGGU_VERIFIKASI sampai diverifikasi oleh Admin.
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Tagihan warga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentProofUrl
 *             properties:
 *               paymentProofUrl:
 *                 type: string
 *                 example: https://minio.local/receipts/struk-ipl-nov.jpg
 *               notes:
 *                 type: string
 *                 example: Transfer via Bank Mandiri an Andi Pratama
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diunggah dan menunggu verifikasi
 *       400:
 *         description: Validasi input gagal atau tagihan sudah lunas
 *       401:
 *         description: Belum login
 *       403:
 *         description: Forbidden - Bukan pemilik tagihan
 *       404:
 *         description: Tagihan tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access: Please login first" },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return badRequest("ID tagihan tidak valid");
    }

    const body: unknown = await req.json();
    const validation = payBillSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(
        "Validasi input pembayaran tagihan gagal",
        z.treeifyError(validation.error),
      );
    }

    const updatedBill = await payResidentBill(
      authUser.userId,
      id,
      validation.data,
    );

    return ok(
      "Bukti pembayaran tagihan berhasil dikirim dan menunggu verifikasi admin.",
      { data: updatedBill },
    );
  } catch (error: unknown) {
    console.error("[FINANCE_BILLS_PAY_POST]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memproses pembayaran tagihan.";
    return badRequest(message);
  }
}
