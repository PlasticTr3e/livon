import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { invalidate } from "@/lib/cache";
import { getAuthUser, revokeAllUserTokens } from "@/lib/auth";
import { ok, badRequest, notFound, internalError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

const safeCitizenSelect = {
  id: true,
  email: true,
  emailVerified: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  citizenProfile: true,
} as const;

const updateCitizenSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  fullName: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  isVerified: z.boolean().optional(),
});

/**
 * @swagger
 * /api/agency/citizens/{id}:
 *   get:
 *     summary: Get specific citizen details
 *     description: Retrieve detailed information for a specific citizen by their User ID, including their full profile. Only accessible by admins (AGENCY).
 *     tags:
 *       - Agency Citizens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the citizen (User ID)
 *     responses:
 *       200:
 *         description: Citizen details retrieved successfully
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
 *                   example: Citizen details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     citizenProfile:
 *                       type: object
 *       404:
 *         description: Citizen not found
 *       401:
 *         description: Unauthorized - missing token or user is not an AGENCY
 *       400:
 *         description: Failed to retrieve citizen details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }
    if (authUser.role === Role.DEVELOPER) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Role DEVELOPER dibatasi dan tidak memiliki izin mengakses data sensitif perumahan/warga",
        },
        { status: 403 },
      );
    }
    if (authUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const citizen = await prisma.user.findFirst({
      where: {
        id,
        role: Role.WARGA,
        deletedAt: null,
      },
      select: safeCitizenSelect,
    });

    if (!citizen) {
      return notFound("Citizen not found");
    }

    return ok("Citizen details retrieved successfully", {
      data: citizen,
    });
  } catch (error) {
    console.error("[AGENCY_CITIZEN_GET]", error);
    return internalError("Failed to retrieve citizen details");
  }
}

/**
 * @swagger
 * /api/agency/citizens/{id}:
 *   put:
 *     summary: Update citizen status & profile
 *     description: Update a citizen's profile details or administrative properties like verifying their account (isVerified). Only accessible by admins (AGENCY).
 *     tags:
 *       - Agency Citizens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the citizen to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: "WARGA"
 *               fullName:
 *                 type: string
 *                 example: "Budi Santoso Diperbarui"
 *               phone:
 *                 type: string
 *                 example: "081234567891"
 *               isVerified:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Citizen updated successfully
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
 *                   example: Citizen updated successfully
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Citizen not found
 *       400:
 *         description: Failed to update citizen
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }
    if (authUser.role === Role.DEVELOPER) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Role DEVELOPER dibatasi dan tidak memiliki izin mengubah data warga",
        },
        { status: 403 },
      );
    }
    if (authUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body: unknown = await req.json();

    const parsed = updateCitizenSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Validation failed",
        z.treeifyError(parsed.error),
      );
    }

    const { role, fullName, phone, isVerified } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { id, role: Role.WARGA, deletedAt: null },
    });

    if (!existingUser) {
      return notFound("Citizen not found");
    }

    const hasProfileUpdate =
      fullName !== undefined || phone !== undefined || isVerified !== undefined;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(hasProfileUpdate && {
          citizenProfile: {
            update: {
              ...(fullName !== undefined && { fullName }),
              ...(phone !== undefined && { phone }),
              ...(isVerified !== undefined && { isVerified }),
            },
          },
        }),
      },
      select: safeCitizenSelect,
    });

    if (role !== undefined) await revokeAllUserTokens(id);
    await invalidate("dashboard");
    return ok("Citizen updated successfully", { data: updatedUser });
  } catch (error) {
    console.error("[AGENCY_CITIZEN_PUT]", error);
    return internalError("Failed to update citizen");
  }
}

/**
 * @swagger
 * /api/agency/citizens/{id}:
 *   delete:
 *     summary: Delete a citizen account
 *     description: Soft-delete a citizen's account by marking their `deletedAt` timestamp. Only accessible by admins (AGENCY).
 *     tags:
 *       - Agency Citizens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the citizen to delete
 *     responses:
 *       200:
 *         description: Citizen account has been successfully deleted
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
 *                   example: Citizen account has been successfully deleted (soft-delete)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Citizen not found
 *       400:
 *         description: Failed to delete citizen
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }
    if (authUser.role === Role.DEVELOPER) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Role DEVELOPER dibatasi dan tidak memiliki izin menghapus akun warga",
        },
        { status: 403 },
      );
    }
    if (authUser.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingUser = await prisma.user.findFirst({
      where: { id, role: Role.WARGA, deletedAt: null },
    });

    if (!existingUser) {
      return notFound("Citizen not found");
    }

    // Perform a soft-delete
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await revokeAllUserTokens(id);
    await invalidate("dashboard");
    return ok("Citizen account has been successfully deleted (soft-delete)");
  } catch (error: unknown) {
    console.error("[AGENCY_CITIZEN_DELETE]", error);
    return internalError("Failed to delete citizen");
  }
}
