import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieves the list of personal notifications (unread first).
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       400:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: Invalid or missing token");
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: authUser.userId },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    });

    return ok("Notifications retrieved successfully", { data: notifications });
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return internalError("An error occurred fetching notifications");
  }
}
