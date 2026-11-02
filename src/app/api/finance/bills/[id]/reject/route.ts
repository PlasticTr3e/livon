import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import { rejectResidentBill } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/finance/bills/{id}/reject:
 *   patch:
 *     summary: Tolak bukti pembayaran tagihan warga (Khusus Admin)
 *     description: Menolak bukti pembayaran tagihan warga yang tidak valid dan mengembalikan statusnya ke BELUM_BAYAR disertai catatan alasan penolakan.
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Bukti transfer buram dan nominal tidak sesuai
 *     responses:
 *       200:
 *         description: Bukti pembayaran tagihan berhasil ditolak
 *       400:
 *         description: Tagihan tidak ditemukan atau sudah lunas
 *       401:
 *         description: Belum login
 *       403:
 *         description: Forbidden - Hanya Admin yang berhak menolak
 *       500:
 *         description: Terjadi kesalahan pada server internal
 */
export async function PATCH(req: NextRequest, { params }: RouteProps) {
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
            "Forbidden: Hanya role ADMIN yang memiliki izin untuk menolak pembayaran tagihan warga.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!id) {
      return badRequest("ID tagihan tidak valid");
    }

    let reason: string | undefined;
    try {
      const body: unknown = await req.json();
      if (body && typeof body === "object" && "reason" in body) {
        reason = String((body as { reason?: string }).reason);
      }
    } catch {
      // Body is optional
    }

    const updatedBill = await rejectResidentBill(authUser.userId, id, reason);

    return ok("Bukti pembayaran tagihan telah ditolak.", {
      data: updatedBill,
    });
  } catch (error: unknown) {
    console.error("[FINANCE_BILLS_REJECT_PATCH]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menolak pembayaran tagihan.";
    return badRequest(message);
  }
}
