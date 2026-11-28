import { canManageProjects } from "@/lib/permissions";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { cached, invalidate } from "@/lib/cache";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { ProjectStatus, Role } from "@/generated/prisma/enums";
import { broadcastNotification } from "@/lib/notifications";
import { PROJECT_ADDRESS_MAX_LENGTH } from "@/lib/project-address";
import { isSafeMediaUrl } from "@/lib/url-safety";

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

    const cacheKey =
      minLat && maxLat && minLng && maxLng
        ? `list:${minLat}:${maxLat}:${minLng}:${maxLng}`
        : "list:all";

    const projects = await cached("projects", cacheKey, 60, async () => {
      if (minLat && maxLat && minLng && maxLng) {
        return prisma.$queryRaw`
        SELECT id, title, description, status, latitude, longitude, address,
          "budgetTarget", "currentFunding", "estimatedDurationDays", "imageUrls"
        FROM projects
        WHERE latitude BETWEEN ${parseFloat(minLat)} AND ${parseFloat(maxLat)}
          AND longitude BETWEEN ${parseFloat(minLng)} AND ${parseFloat(maxLng)}
          AND "deletedAt" IS NULL
      `;
      }
      return prisma.project.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budgetTarget: true,
          currentFunding: true,
          estimatedDurationDays: true,
          imageUrls: true,
          latitude: true,
          longitude: true,
          address: true,
        },
      });
    });

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
  imageUrls: z
    .array(z.string().trim().refine(isSafeMediaUrl, "Invalid image URL"))
    .optional(),
  documentUrls: z
    .array(z.string().trim().refine(isSafeMediaUrl, "Invalid document URL"))
    .optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().trim().max(PROJECT_ADDRESS_MAX_LENGTH).nullish(),
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
    const authUser = await getAuthUser(req);
    if (!authUser || !canManageProjects(authUser.role)) {
      return Response.json(
        {
          success: false,
          message: "Forbidden: Only Admins can create projects",
        },
        { status: authUser ? 403 : 401 },
      );
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
        address: data.address || null,
        estimatedDurationDays: data.estimatedDurationDays,
        categoryId: data.categoryId,
        agencyId: authUser.userId,
      },
    });

    if (data.latitude !== undefined && data.longitude !== undefined) {
      await prisma.$executeRaw`
        UPDATE projects
        SET "locationGeom" = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)
        WHERE id = ${project.id}
      `;
    }

    await broadcastNotification({
      recipientRole: Role.WARGA,
      title: "Proyek Baru",
      type: "NEW_PROJECT",
      message: `Ada proyek baru berjudul "${project.title}".`,
      projectId: project.id,
    });

    await invalidate("projects", "priority", "dashboard");
    return created("Project created successfully", { data: project });
  } catch (error) {
    console.error("POST Project Error:", error);
    return internalError("An error occurred creating the project");
  }
}
