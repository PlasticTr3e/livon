import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, internalError, notFound, badRequest } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project details
 *     description: Fetch complete details of a project including its category, agency profile, updates, and counts (votes/comments).
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the project
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        agency: {
          select: {
            agencyProfile: {
              select: { agencyName: true, isVerified: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { votes: true, comments: true },
        },
      },
    });

    if (!project) return notFound("Project not found");

    return ok("Project details retrieved successfully", { data: project });
  } catch (error) {
    console.error("GET Project Details Error:", error);
    return internalError("An error occurred fetching project details");
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project status and/or documents
 *     description: Update the status or documentUrl array of a project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the project
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [USULAN, DISETUJUI, BERJALAN, SELESAI]
 *               notes:
 *                 type: string
 *               documentUrl:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid input provided
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest(
        "Unauthorized access. Cuma admin yang dapat mengubah status proyek.",
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes, documentUrl } = body;

    const validStatuses = ["USULAN", "DISETUJUI", "BERJALAN", "SELESAI"];
    const updateData: Record<string, unknown> = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return badRequest("Invalid status provided");
      }
      updateData.status = status as
        | "USULAN"
        | "DISETUJUI"
        | "BERJALAN"
        | "SELESAI";
    }

    if (documentUrl !== undefined) {
      if (!Array.isArray(documentUrl)) {
        return badRequest("documentUrl must be an array of strings");
      }
      updateData.documentUrl = documentUrl;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("No valid fields provided for update");
    }

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) return notFound("Project not found");
    if (existingProject.agencyId !== authUser.userId) {
      return badRequest("Forbidden: You do not own this project");
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    if (status && notes) {
      await prisma.projectUpdate.create({
        data: {
          projectId: id,
          title: `Status updated to ${status}`,
          description: notes,
        },
      });
    }

    return ok("Project updated successfully", { data: project });
  } catch (error: unknown) {
    console.error("PATCH Project Error:", error);
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return notFound("Project not found");
    }
    return internalError("An error occurred updating project");
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Soft delete a project
 *     description: Mark a project as deleted by setting its deletedAt timestamp.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the project
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies delete projects");
    }

    const { id } = await params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) return notFound("Project not found");
    if (existingProject.agencyId !== authUser.userId) {
      return badRequest("Forbidden: You do not own this project");
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    return ok("Project soft deleted successfully", { data: project });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return notFound("Project not found");
    }
    console.error("DELETE Project Error:", error);
    return internalError("An error occurred deleting project");
  }
}
