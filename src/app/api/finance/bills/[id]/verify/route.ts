import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import { verifyResidentBill } from "@/services/finance/finance-service";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/finance/bills/{id}/verify:
 *   patch:
 *     summary: Verifikasi pembayaran tagihan iuran warga (Khusus Admin)
 *     description: Memverifikasi bukti pembayaran tagihan warga menjadi LUNAS. Otomatis mencatat transaksi pemasukan (PEMASUKAN, IPL) dan menambah saldo kas IPL secara realtime dalam transaksi atomik.
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
 *     responses:
 *       200:
 *         description: Pembayaran tagihan berhasil diverifikasi dan saldo kas IPL bertambah
 *       400:
 *         description: Tagihan tidak ditemukan atau sudah lunas
 *       401:
 *         description: Belum login
 *       403:
 *         description: Forbidden - Hanya Admin yang berhak memverifikasi
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
            "Forbidden: Hanya role ADMIN yang memiliki izin untuk memverifikasi pembayaran tagihan warga.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!id) {
      return badRequest("ID tagihan tidak valid");
    }

    const updatedBill = await verifyResidentBill(authUser.userId, id);

    return ok(
      "Pembayaran tagihan berhasil diverifikasi, status menjadi LUNAS, dan saldo kas IPL telah bertambah.",
      { data: updatedBill },
    );
  } catch (error: unknown) {
    console.error("[FINANCE_BILLS_VERIFY_PATCH]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat memverifikasi tagihan.";
    return badRequest(message);
  }
}
