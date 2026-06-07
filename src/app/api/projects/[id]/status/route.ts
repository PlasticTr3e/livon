import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { ProjectStatus, Role } from "@/generated/prisma/enums";

const statusSchema = z.object({
  status: z.enum(ProjectStatus),
});

/**
 * @swagger
 * /api/projects/{id}/status:
 *   patch:
 *     summary: Update project status (Agency only)
 *     description: Modifies the status of an existing project. Returns 403 if user is not the owning Agency.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [USULAN, DISETUJUI, BERJALAN, SELESAI]
 *     responses:
 *       200:
 *         description: Project status updated
 *       400:
 *         description: Validation failed or Unauthorized
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

    if (existingProject.status !== result.data.status) {
      const followers = await prisma.user.findMany({
        where: {
          OR: [
            { votes: { some: { projectId: id } } },
            { donations: { some: { projectId: id, status: "SUCCESS" } } },
          ],
        },
        select: { id: true },
      });

      if (followers.length > 0) {
        await prisma.notification.createMany({
          data: followers.map((user) => ({
            userId: user.id,
            projectId: id,
            referenceId: updatedProject.id,
            title: "Project Status Updated",
            type: "PROJECT_STATUS",
            message: `The project "${existingProject.title}" is now ${result.data.status}.`,
          })),
        });
      }
    }

    return ok(`Project status updated to ${result.data.status}`, {
      data: updatedProject,
    });
  } catch (error) {
    console.error("PATCH Project Status Error:", error);
    return internalError("An error occurred updating project status");
  }
}
