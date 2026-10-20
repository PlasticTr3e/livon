import { NextRequest } from "next/server";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { toggleCommentLike } from "@/services/community/community-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/community/comments/{id}/like:
 *   post:
 *     summary: Toggle like on a community comment
 *     description: Likes or unlikes a community comment or reply. Accessible by citizens and admins.
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment like status updated successfully
 *       400:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest(
        "Unauthorized: You must be logged in to like a comment.",
      );
    }

    const { id } = await params;
    const result = await toggleCommentLike(id, authUser.userId);

    const message = result.isLiked
      ? "Comment liked successfully"
      : "Comment unliked successfully";

    return ok(message, {
      data: result,
      action: result.isLiked ? "LIKED" : "UNLIKED",
    });
  } catch (error: unknown) {
    console.error("POST Comment Like Error:", error);
    return internalError(
      "An error occurred while updating the comment like status.",
    );
  }
}
