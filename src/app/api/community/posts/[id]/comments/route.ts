import { NextRequest } from "next/server";
import { treeifyError } from "zod";
import { created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { createCommentSchema } from "@/services/community/community-schema";
import { addCommunityComment } from "@/services/community/community-service";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * @swagger
 * /api/community/posts/{id}/comments:
 *   post:
 *     summary: Add a comment or reply to a post
 *     description: Creates a new comment or a reply to an existing comment on a post. Accessible by citizens and admins.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Thank you for the update! I will be joining this Sunday."
 *               parentId:
 *                 type: string
 *                 description: ID of the parent comment if this is a reply
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation failed or unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: You must be logged in to comment.");
    }

    const { id } = await params;
    const body: unknown = await req.json();

    const validation = createCommentSchema.safeParse(body);
    if (!validation.success) {
      return badRequest("Validation failed", treeifyError(validation.error));
    }

    const comment = await addCommunityComment(
      id,
      authUser.userId,
      validation.data,
    );

    return created("Comment created successfully", { data: comment });
  } catch (error: unknown) {
    console.error("POST Community Comment Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while adding the comment.";
    return internalError(errorMessage);
  }
}
