import { NextRequest } from "next/server";
import z from "zod";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

const readSchema = z.object({
  isRead: z.boolean(),
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Updates the isRead status of a specific notification belonging to the current user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the notification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isRead
 *             properties:
 *               isRead:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Validation failed or Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: Invalid or missing token");
    }

    const body = await req.json();
    const result = readSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", z.treeifyError(result.error));

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return notFound("Notification not found");
    if (notification.userId !== authUser.userId) {
      return badRequest("Forbidden: Not your notification");
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: result.data.isRead },
    });

    return ok(`Notification updated`, { data: updatedNotification });
  } catch (error) {
    console.error("PATCH Notification Error:", error);
    return internalError("An error occurred updating the notification");
  }
}
