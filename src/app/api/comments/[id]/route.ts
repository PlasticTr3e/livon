import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     description: Soft delete a comment by setting deletedAt
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a comment
 *     description: Update comment properties like sentimentLabel
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sentimentLabel:
 *                 type: string
 *                 enum: [POSITIVE, NEGATIVE, NEUTRAL]
 *               deletedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "AGENCY") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const commentId = params.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return badRequest("Comment not found");
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    return ok("Comment deleted successfully");
  } catch (error) {
    console.error("DELETE Comment Error:", error);
    return internalError("An error occurred deleting comment");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "AGENCY") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const commentId = params.id;
    const body = await req.json();

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return badRequest("Comment not found");
    }

    type UpdateCommentData = {
      sentimentLabel?: "POSITIF" | "NEGATIF" | "NETRAL" | null;
      deletedAt?: Date | null;
    };
    const updateData: UpdateCommentData = {};
    if (body.sentimentLabel !== undefined) {
      updateData.sentimentLabel =
        body.sentimentLabel as UpdateCommentData["sentimentLabel"];
    }
    if (body.deletedAt !== undefined) {
      updateData.deletedAt = body.deletedAt ? new Date(body.deletedAt) : null;
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
    });

    return ok("Comment updated successfully");
  } catch (error) {
    console.error("PUT Comment Error:", error);
    return internalError("An error occurred updating comment");
  }
}
