import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = projectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          error: z.treeifyError(validation.error),
        },
        { status: 400 },
      );
    }

    const { title, description, budgetTarget, latitude, longitude, agencyId } =
      validation.data;
    const result = await prisma.$transaction(async (tx: any) => {
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          budgetTarget,
          latitude,
          longitude,
          agencyId,
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

    return NextResponse.json(
      {
        success: true,
        message: "Successfully created project and initial update log.",
        data: result,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Project API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while processing the data.",
      },
      { status: 500 },
    );
  }
}
