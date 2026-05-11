import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { created, badRequest, internalError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { broadcastNotification } from "@/lib/notifications";

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
 *     description: Creates a new user with the specified role and profile information. Based on the role, it also creates the corresponding profile (WARGA or AGENCY).
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
 *                 enum: [WARGA, AGENCY]
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
        emailVerified: null,
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

    const token = crypto.randomBytes(32).toString("hex");
    const aDay = 1000 * 60 * 60 * 24;

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: token,
        expires: new Date(Date.now() + aDay),
      },
    });

    if (role === Role.WARGA) {
      await broadcastNotification({
        recipientRole: Role.AGENCY,
        title: "Warga Baru Mendaftar",
        type: "NEW_REGISTRATION",
        message: `${profileData.fullName || email} mendaftar dan menunggu verifikasi.`,
      });

      const agencies = await prisma.user.findMany({
        where: { role: Role.AGENCY },
        select: { id: true },
      });

      if (agencies.length > 0) {
        const agencyNotifications = agencies.map((agency) => ({
          userId: agency.id,
          referenceId: user.id,
          title: "Warga Baru Mendaftar",
          type: "NEW_REGISTRATION",
          message: `${profileData.fullName || email} mendaftar dan menunggu verifikasi.`,
        }));
        await prisma.notification.createMany({
          data: agencyNotifications,
        });
      }
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/api/auth/verify?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"Livon App" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify your Livon Account",
        html: `
          <h2>Welcome to Livon!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" target="_blank">Verify Email</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    } catch (mailError) {
      console.error("Failed to send verification email:", mailError);
      // An endpoint to resend verification should be implemented on the frontend.
    }

    return created("User registered successfully", { data: user });
  } catch (error) {
    console.error("Register Error:", error);
    return internalError("An error occurred during registration");
  }
}
