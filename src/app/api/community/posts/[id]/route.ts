import { NextRequest } from "next/server";
import { ok, badRequest, notFound, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import {
  deleteCommunityPost,
  getCommunityPostDetail,
} from "@/services/community/community-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/community/posts/{id}:
 *   get:
 *     summary: Get single community post details
 *     description: Retrieves details of a single post with its complete comment tree and thread items.
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details retrieved successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    const post = await getCommunityPostDetail(id, authUser?.userId);

    if (!post) {
      return notFound("Post not found");
    }

    return ok("Post retrieved successfully", { data: post });
  } catch (error: unknown) {
    console.error("GET Post Detail Error:", error);
    return internalError("An error occurred while fetching the post.");
  }
}

/**
 * @swagger
 * /api/community/posts/{id}:
 *   delete:
 *     summary: Delete a community post
 *     description: Soft-deletes a post. Permitted for the post author or an administrator (AGENCY).
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       400:
 *         description: Unauthorized or forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest(
        "Unauthorized: You must be logged in to delete a post.",
      );
    }

    const { id } = await params;
    const result = await deleteCommunityPost(
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
    console.error("DELETE Post Error:", error);
    return internalError("An error occurred while deleting the post.");
  }
}
