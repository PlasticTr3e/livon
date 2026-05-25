import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

// /**
//  * @swagger
//  * /api/comments/{id}:
//  *   delete:
//  *     summary: Moderate (soft-delete) a comment
//  *     description: Hide a specific comment by its ID (soft delete). This action is meant for moderation and is strictly restricted to admins (AGENCY).
//  *     tags:
//  *       - Comments
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The ID of the comment to moderate/delete
//  *     responses:
//  *       200:
//  *         description: Comment moderated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: Comment has been successfully moderated (soft-deleted).
//  *       401:
//  *         description: Unauthorized - missing token or user is not an AGENCY
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: false
//  *                 message:
//  *                   type: string
//  *                   example: Unauthorized access. Only admin can moderate comments.
//  *       404:
//  *         description: Comment not found or already deleted
//  *       400:
//  *         description: Failed to moderate comment
//  */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. Only admin can moderate comments.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existingComment = await prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingComment) {
      return notFound("Comment not found or already deleted.");
    }

    await prisma.comment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return ok("Comment has been successfully moderated (soft-deleted).");
  } catch (error) {
    console.error("[COMMENT_MODERATION_DELETE]", error);
    return badRequest("Failed to moderate comment", error);
  }
}

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update or flag a comment
 *     description: Update specific fields of a comment, such as flagging it for moderation.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Comment not found
 *       400:
 *         description: Failed to update comment
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existingComment = await prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingComment) {
      return notFound("Comment not found or already deleted.");
    }

    // Memperbarui komentar menggunakan data yang dikirimkan oleh frontend
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        ...body,
      },
    });

    return ok("Comment has been successfully updated.", {
      data: updatedComment,
    });
  } catch (error) {
    console.error("[COMMENT_UPDATE_PUT]", error);
    return badRequest("Failed to update comment", error);
  }
}
