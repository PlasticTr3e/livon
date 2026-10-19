import { NextRequest } from "next/server";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { togglePostLike } from "@/services/community/community-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/community/posts/{id}/like:
 *   post:
 *     summary: Toggle like on a community post
 *     description: Likes or unlikes a community post. Accessible by citizens and admins.
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like status updated successfully
 *       400:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: You must be logged in to like a post.");
    }

    const { id } = await params;
    const result = await togglePostLike(id, authUser.userId);

    const message = result.isLiked
      ? "Post liked successfully"
      : "Post unliked successfully";

    return ok(message, {
      data: result,
      action: result.isLiked ? "LIKED" : "UNLIKED",
    });
  } catch (error: unknown) {
    console.error("POST Post Like Error:", error);
    return internalError(
      "An error occurred while updating the post like status.",
    );
  }
}
