import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  created,
  badRequest,
  internalError,
  notFound,
} from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

const updateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/projects/{id}/updates:
 *   post:
 *     summary: Post a project update log
 *     description: Submit log/progress update indicating what has been achieved.
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *               imageUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project update log added
 *       400:
 *         description: Validation failed or Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies can post updates");
    }

    const { id: projectId } = await params;

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!existingProject) return notFound("Project not found");
    if (existingProject.agencyId !== authUser.userId) {
      return badRequest("Forbidden: You do not own this project");
    }

    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", result.error.flatten());

    const projectUpdate = await prisma.projectUpdate.create({
      data: {
        projectId,
        title: result.data.title,
        description: result.data.description,
        imageUrls: result.data.imageUrls || [],
      },
    });

    return created("Project update log added successfully", {
      data: projectUpdate,
    });
  } catch (error) {
    console.error("POST Project Update Error:", error);
    return internalError("An error occurred adding the project update");
  }
}
