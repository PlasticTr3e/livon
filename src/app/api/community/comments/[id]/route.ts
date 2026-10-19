import { NextRequest } from "next/server";
import { ok, badRequest, notFound, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { deleteCommunityComment } from "@/services/community/community-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/community/comments/{id}:
 *   delete:
 *     summary: Delete a community comment
 *     description: Soft-deletes a comment. Permitted for the comment author or an administrator (AGENCY).
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       400:
 *         description: Unauthorized or forbidden
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest(
        "Unauthorized: You must be logged in to delete a comment.",
      );
    }

    const { id } = await params;
    const result = await deleteCommunityComment(
      id,
      authUser.userId,
      authUser.role,
    );

    if (!result.success) {
      if (result.message.includes("not found")) {
        return notFound(result.message);
      }
      return badRequest(result.message);
    }

    return ok(result.message);
  } catch (error: unknown) {
    console.error("DELETE Community Comment Error:", error);
    return internalError("An error occurred while deleting the comment.");
  }
}
