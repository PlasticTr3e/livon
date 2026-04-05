import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, internalError, notFound } from "@/lib/api-response";

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
