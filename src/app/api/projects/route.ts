import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import {
  badRequest,
  created,
  internalError,
  notFound,
  ok,
} from "@/lib/api-response";
import { z } from "zod";

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long."),
  budgetTarget: z.number().nonnegative("Budget target cannot be negative."),
  latitude: z
    .number()
    .refine((val) => val !== undefined, "Latitude is required."),
  longitude: z
    .number()
    .refine((val) => val !== undefined, "Longitude is required."),
  agencyId: z.uuid("Invalid Agency ID format. Must be a UUID."),
  categoryId: z.number().nonnegative("Must be a number").optional(),
});

const getProjectQuerySchema = z.object({
  id: z.uuid("Invalid project ID format. Must be a UUID."),
});

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    const validation = getProjectQuerySchema.safeParse({ id });
    if (!validation.success) {
      return badRequest("Validation failed.", z.treeifyError(validation.error));
    }

    const project = await prisma.project.findUnique({
      where: { id: validation.data.id },
      include: {
        agency: {
          select: {
            id: true,
            email: true,
          },
        },
        category: true,
      },
    });

    if (!project) {
      return notFound("Project not found.");
    }

    return ok("Project fetched successfully.", { data: project });
  } catch (error: unknown) {
    console.error("Project API Error:", error);
    return internalError(
      "An internal server error occurred while fetching the project.",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = projectSchema.safeParse(body);
    if (!validation.success) {
      return badRequest("Validation failed.", z.treeifyError(validation.error));
    }

    const {
      title,
      description,
      budgetTarget,
      latitude,
      longitude,
      agencyId,
      categoryId,
    } = validation.data;

    const agencyUser = await prisma.user.findUnique({
      where: { id: agencyId },
      select: { id: true, role: true },
    });

    if (!agencyUser) {
      return notFound("Agency user not found.");
    }

    if (agencyUser.role !== Role.AGENCY) {
      return badRequest("Provided agencyId does not belong to an AGENCY user.");
    }

    const existingCategory = await prisma.projectCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!existingCategory) {
      return notFound("Category not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          budgetTarget,
          latitude,
          longitude,
          agencyId,
          categoryId: categoryId ?? null,
        },
      });

      await tx.projectUpdate.create({
        data: {
          title: "Perencanaan Dimulai",
          description: `Rencana untuk proyek "${title}" telah resmi masuk ke dalam sistem NangorLens.`,
          projectId: newProject.id,
        },
      });

      return newProject;
    });

    return created("Successfully created project and initial update log.", {
      data: result,
    });
  } catch (error: unknown) {
    console.error("Project API Error:", error);
    return internalError(
      "An internal server error occurred while processing the data.",
    );
  }
}
