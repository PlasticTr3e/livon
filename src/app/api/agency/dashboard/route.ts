import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { Role, DonationStatus } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/agency/dashboard:
 *   get:
 *     summary: Get dashboard aggregate metrics
 *     description: Retrieve summary metrics for the agency dashboard, including total active (verified) citizens, total active projects, total vote participation, and total accumulated funds from successful donations. Only accessible by admins (AGENCY).
 *     tags:
 *       - Agency Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data agregat dashboard
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
 *                   example: Berhasil mengambil data agregat dashboard
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalWargaAktif:
 *                       type: integer
 *                       description: Jumlah warga dengan status isVerified true
 *                       example: 154
 *                     totalProyek:
 *                       type: integer
 *                       description: Jumlah total proyek yang belum dihapus (deletedAt null)
 *                       example: 24
 *                     totalPartisipasi:
 *                       type: integer
 *                       description: Jumlah total interaksi/voting
 *                       example: 1205
 *                     totalDana:
 *                       type: number
 *                       description: Total jumlah dana dari donasi berstatus SUCCESS
 *                       example: 7500000
 *       401:
 *         description: Unauthorized - missing token or user is not an AGENCY
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       400:
 *         description: Gagal mengambil metrik dashboard
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }

    const [totalWargaAktif, totalProyek, totalPartisipasi, donasiAgregat] =
      await Promise.all([
        prisma.citizenProfile.count({
          where: { isVerified: true },
        }),
        prisma.project.count({
          where: { deletedAt: null },
        }),
        prisma.vote.count(),
        prisma.donation.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: DonationStatus.SUCCESS,
          },
        }),
      ]);

    const totalDana = donasiAgregat._sum.amount
      ? Number(donasiAgregat._sum.amount)
      : 0;

    return ok("Berhasil mengambil data agregat dashboard", {
      data: {
        totalWargaAktif,
        totalProyek,
        totalPartisipasi,
        totalDana,
      },
    });
  } catch (error) {
    console.error("[AGENCY_DASHBOARD_GET]", error);
    return badRequest("Gagal mengambil metrik dashboard.", error);
  }
}
