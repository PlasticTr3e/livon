import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

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
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const citizen = await prisma.user.findFirst({
      where: {
        id,
        role: Role.WARGA,
        deletedAt: null,
      },
      include: {
        citizenProfile: true,
      },
    });

    if (!citizen) {
      return notFound("Citizen not found");
    }

    const { passwordHash: _passwordHash, ...safeCitizenData } = citizen;

    return ok("Citizen details retrieved successfully", {
      data: safeCitizenData,
    });
  } catch (error) {
    console.error("[AGENCY_CITIZEN_GET]", error);
    return badRequest("Failed to retrieve citizen details", error);
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
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existingUser = await prisma.user.findFirst({
      where: { id, role: Role.WARGA, deletedAt: null },
    });

    if (!existingUser) {
      return notFound("Citizen not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role && { role: body.role }), // Allow role modification if necessary
        citizenProfile: {
          update: {
            ...(body.fullName && { fullName: body.fullName }),
            ...(body.phone && { phone: body.phone }),
            ...(body.isVerified !== undefined && {
              isVerified: body.isVerified,
            }),
          },
        },
      },
      include: {
        citizenProfile: true,
      },
    });

    const { passwordHash: _passwordHash, ...safeUpdatedData } = updatedUser;

    return ok("Citizen updated successfully", { data: safeUpdatedData });
  } catch (error) {
    console.error("[AGENCY_CITIZEN_PUT]", error);
    return badRequest("Failed to update citizen", error);
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
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
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

    return ok("Citizen account has been successfully deleted (soft-delete)");
  } catch (error: unknown) {
    console.error("[AGENCY_CITIZEN_DELETE]", error);
    return badRequest(
      "Failed to delete citizen",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
