import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/agency/citizens:
 *   get:
 *     summary: Get all citizens (Warga)
 *     description: Retrieve a list of all active citizens (users with role WARGA), including their profile details like NIK, KK, and address. Only accessible by admins (AGENCY).
 *     tags:
 *       - Agency Citizens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Citizens retrieved successfully
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
 *                   example: Citizens retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "user-123"
 *                       email:
 *                         type: string
 *                         example: "warga@example.com"
 *                       emailVerified:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       citizenProfile:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           fullName:
 *                             type: string
 *                             example: "Budi Santoso"
 *                           phone:
 *                             type: string
 *                             example: "081234567890"
 *                           kkNumber:
 *                             type: string
 *                             example: "3171234567890123"
 *                           nik:
 *                             type: string
 *                             example: "3171234567890001"
 *                           blockHouse:
 *                             type: string
 *                             example: "A1"
 *                           houseNumber:
 *                             type: string
 *                             example: "12"
 *                           isVerified:
 *                             type: boolean
 *                             example: true
 *       401:
 *         description: Unauthorized - missing token or user is not an AGENCY
 *       400:
 *         description: Failed to retrieve citizens
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

    const citizens = await prisma.user.findMany({
      where: {
        role: Role.WARGA,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        citizenProfile: {
          select: {
            fullName: true,
            phone: true,
            kkNumber: true,
            nik: true,
            blockHouse: true,
            houseNumber: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok("Citizens retrieved successfully", { data: citizens });
  } catch (error: unknown) {
    console.error("[AGENCY_CITIZENS_GET]", error);
    return badRequest("Failed to retrieve citizens", error);
  }
}
