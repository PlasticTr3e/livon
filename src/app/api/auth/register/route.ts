import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { created, badRequest, internalError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import { error } from "console";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(Role),

  fullName: z.string().optional(),
  phone: z.string().optional(),
  kkNumber: z.string().optional(),
  nik: z.string().optional(),
  blockHouse: z.string().optional(),
  houseNumber: z.string().optional(),

  agencyName: z.string().optional(),
  address: z.string().optional(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with the specified role and profile information. Based on the role, it also creates the corresponding profile (WARGA or DINAS).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [WARGA, DINAS]
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               kkNumber:
 *                 type: string
 *               nik:
 *                 type: string
 *               blockHouse:
 *                 type: string
 *               houseNumber:
 *                 type: string
 *               agencyName:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation failed or user already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return badRequest("Validation failed", z.treeifyError(result.error));
    }

    const { email, password, role, ...profileData } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return badRequest("User with this email already exists");
    }

    if (
      role === Role.WARGA &&
      (!profileData.fullName ||
        !profileData.phone ||
        !profileData.kkNumber ||
        !profileData.nik)
    ) {
      return badRequest(
        "WARGA role requires fullName, phone, kkNumber, and nik",
      );
    }
    if (
      role === Role.AGENCY &&
      (!profileData.agencyName || !profileData.phone || !profileData.address)
    ) {
      return badRequest("AGENCY role requires agencyName, phone, and address");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        ...(role === Role.WARGA
          ? {
              citizenProfile: {
                create: {
                  fullName: profileData.fullName!,
                  phone: profileData.phone!,
                  kkNumber: profileData.kkNumber!,
                  nik: profileData.nik!,
                  blockHouse: profileData.blockHouse,
                  houseNumber: profileData.houseNumber,
                },
              },
            }
          : {
              agencyProfile: {
                create: {
                  agencyName: profileData.agencyName!,
                  phone: profileData.phone!,
                  address: profileData.address!,
                },
              },
            }),
      },
      select: { id: true, email: true, role: true },
    });

    return created("User registered successfully", { data: user });
  } catch (error) {
    console.error("Register Error:", error);
    return internalError("An error occurred during registration");
  }
}
