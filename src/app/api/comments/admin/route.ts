import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

/**
 * @swagger
 * /api/comments/admin:
 *   get:
 *     summary: Get all comments for admin
 *     description: Retrieve all comments for admin monitoring
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is admin (AGENCY role)
    const user = await getAuthUser(req);
    if (!user || user.role !== "AGENCY") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            citizenProfile: { select: { fullName: true } },
            agencyProfile: { select: { agencyName: true } },
          },
        },
        project: { select: { id: true, title: true } },
        news: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok("Comments retrieved successfully", { data: comments });
  } catch (error) {
    console.error("GET Admin Comments Error:", error);
    return internalError("An error occurred fetching comments");
  }
}
