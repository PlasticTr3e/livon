import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { ProjectStatus, Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieve projects for the map
 *     description: Returns a list of projects, optionally filtered by a bounding box.
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: minLat
 *         schema:
 *           type: number
 *         description: Minimum latitude
 *       - in: query
 *         name: maxLat
 *         schema:
 *           type: number
 *         description: Maximum latitude
 *       - in: query
 *         name: minLng
 *         schema:
 *           type: number
 *         description: Minimum longitude
 *       - in: query
 *         name: maxLng
 *         schema:
 *           type: number
 *         description: Maximum longitude
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minLat = searchParams.get("minLat");
    const maxLat = searchParams.get("maxLat");
    const minLng = searchParams.get("minLng");
    const maxLng = searchParams.get("maxLng");

    let projects;

    if (minLat && maxLat && minLng && maxLng) {
      projects = await prisma.$queryRaw`
        SELECT id, title, status, latitude, longitude
        FROM projects
        WHERE latitude BETWEEN ${parseFloat(minLat)} AND ${parseFloat(maxLat)}
          AND longitude BETWEEN ${parseFloat(minLng)} AND ${parseFloat(maxLng)}
          AND "deletedAt" IS NULL
      `;
    } else {
      projects = await prisma.project.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          latitude: true,
          longitude: true,
        },
      });
    }

    return ok("Projects retrieved successfully", { data: projects });
  } catch (error) {
    console.error("GET Projects Error:", error);
    return internalError("An error occurred fetching projects");
  }
}

const createProjectSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  budgetTarget: z.number().positive(),
  imageUrls: z.array(z.string()).optional(),
  documentUrls: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedDurationDays: z.number().int().positive().optional(),
  categoryId: z.number().int().optional(),
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (Agency only)
 *     description: Creates a draft project with status USULAN. Requires Agency role token in Authorization header.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - budgetTarget
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               budgetTarget:
 *                 type: number
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               documentUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               estimatedDurationDays:
 *                 type: number
 *               categoryId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation failed or Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies can create projects");
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", z.treeifyError(result.error));

    const data = result.data;

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        status: ProjectStatus.USULAN,
        budgetTarget: data.budgetTarget,
        currentFunding: 0,
        imageUrls: data.imageUrls || [],
        documentUrl: data.documentUrls || [],
        latitude: data.latitude,
        longitude: data.longitude,
        estimatedDurationDays: data.estimatedDurationDays,
        categoryId: data.categoryId,
        agencyId: authUser.userId,
      },
    });

    if (data.latitude && data.longitude) {
      await prisma.$executeRawUnsafe(
        `UPDATE projects SET "locationGeom" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        data.longitude,
        data.latitude,
        project.id,
      );
    }

    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        projectId: project.id,
        title: "Membuat Proyek",
        type: "ACTIVITY_LOG",
        message: `Anda telah membuat usulan proyek baru : ${project.title}`,
      },
    });

    const wargaUsers = await prisma.user.findMany({
      where: { role: Role.WARGA },
      select: { id: true },
    });

    if (wargaUsers.length > 0) {
      const wargaNotifications = wargaUsers.map((user) => ({
        userId: user.id,
        projectId: project.id,
        title: "Proyek Baru",
        type: "NEW_PROJECT",
        message: `Ada usulan proyek baru di daerahmu : ${project.title}. Yuk cek detailnya!`,
      }));

      await prisma.notification.createMany({
        data: wargaNotifications,
      });
    }

    return created("Project created successfully", { data: project });
  } catch (error) {
    console.error("POST Project Error:", error);
    return internalError("An error occurred creating the project");
  }
}
