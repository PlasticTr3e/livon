import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { ProjectStatus, Role } from "@/generated/prisma/enums";

const statusSchema = z.object({
  status: z.enum(ProjectStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies can update project status");
    }

    const body = await req.json();
    const result = statusSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", result.error.flatten());

    const { id } = await params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) return notFound("Project not found");
    if (existingProject.agencyId !== authUser.userId) {
      return badRequest("Forbidden: You do not own this project");
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { status: result.data.status },
    });

    return ok(`Project status updated to ${result.data.status}`, {
      data: updatedProject,
    });
  } catch (error) {
    console.error("PATCH Project Status Error:", error);
    return internalError("An error occurred updating project status");
  }
}
