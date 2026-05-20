import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     description: Retrieve the current authenticated user's profile and details.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       400:
 *         description: Unauthorized or missing token
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return badRequest("Unauthorized: Invalid or missing token");

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        citizenProfile: true,
        agencyProfile: true,
      },
    });

    if (!user) return badRequest("User not found");

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      citizenProfile: user.citizenProfile,
      agencyProfile: user.agencyProfile,
    };

    return ok("Profile fetched successfully", { data: safeUser });
  } catch (error: unknown) {
    console.error("Profile GET Error:", error);
    return internalError("An error occurred fetching the profile");
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(), // For agency
  blockHouse: z.string().optional(), // For citizen
  houseNumber: z.string().optional(), // For citizen
  agencyName: z.string().optional(), // For agency
  email: z.string().email().optional(), // For user
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update profile details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               blockHouse:
 *                 type: string
 *               houseNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Unauthorized or Invalid data
 *       500:
 *         description: Internal server error
 */
export async function PUT(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return badRequest("Unauthorized: Invalid or missing token");

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", result.error.flatten());

    const data = result.data;
    let updatableData;

    if (data.email) {
      // Check if email is taken by someone else
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== authUser.userId) {
        return badRequest("Email is already in use");
      }
      await prisma.user.update({
        where: { id: authUser.userId },
        data: { email: data.email },
      });
    }

    if (authUser.role === Role.WARGA) {
      updatableData = await prisma.citizenProfile.update({
        where: { userId: authUser.userId },
        data: {
          fullName: data.fullName,
          phone: data.phone,
          blockHouse: data.blockHouse,
          houseNumber: data.houseNumber,
        },
      });
    } else if (authUser.role === Role.AGENCY) {
      updatableData = await prisma.agencyProfile.update({
        where: { userId: authUser.userId },
        data: {
          agencyName: data.agencyName,
          phone: data.phone,
          address: data.address,
        },
      });
    }

    return ok("Profile updated successfully", { data: updatableData });
  } catch (error: unknown) {
    console.error("Profile PUT Error:", error);
    return internalError("An error occurred updating the profile");
  }
}
