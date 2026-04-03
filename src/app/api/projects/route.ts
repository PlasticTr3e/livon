import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { ProjectStatus, Role } from "@/generated/prisma/enums";

// To handle PostGIS coordinates using Prisma raw queries for the geometry field
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const minLat = searchParams.get("minLat");
    const maxLat = searchParams.get("maxLat");
    const minLng = searchParams.get("minLng");
    const maxLng = searchParams.get("maxLng");

    let projects;

    if (minLat && maxLat && minLng && maxLng) {
      // Bounding box request (Development Map) - Prisma Raw Query for PostGIS
      projects = await prisma.$queryRaw`
        SELECT id, title, status, latitude, longitude
        FROM projects
        WHERE latitude BETWEEN ${parseFloat(minLat)} AND ${parseFloat(maxLat)}
          AND longitude BETWEEN ${parseFloat(minLng)} AND ${parseFloat(maxLng)}
          AND deletedAt IS NULL
      `;
    } else {
      // Fallback: Fetch all active projects if no bounding box provided
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
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedDurationDays: z.number().int().positive().optional(),
  categoryId: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies can create projects");
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", result.error.flatten());

    const data = result.data;

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        status: ProjectStatus.USULAN,
        budgetTarget: data.budgetTarget,
        currentFunding: 0,
        imageUrls: data.imageUrls || [],
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

    return created("Project created successfully", { data: project });
  } catch (error) {
    console.error("POST Project Error:", error);
    return internalError("An error occurred creating the project");
  }
}
