import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError, notFound } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Deletes a specific notification belonging to the current user.
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
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       400:
 *         description: Unauthorized or Forbidden
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: Invalid or missing token");
    }

    const { id } = await params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return notFound("Notification not found");
    if (notification.userId !== authUser.userId) {
      return badRequest("Forbidden: Not your notification");
    }

    await prisma.notification.delete({
      where: { id },
    });

    return ok("Notification deleted successfully");
  } catch (error) {
    console.error("DELETE Notification Error:", error);
    return internalError("An error occurred deleting the notification");
  }
}
