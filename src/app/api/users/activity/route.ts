import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { badRequest, ok, internalError } from "@/lib/api-response";
import { DonationStatus } from "@/generated/prisma/enums";
import { getAuthUser } from "@/lib/auth";

/**
 * @swagger
 * /api/users/activity:
 *   get:
 *     summary: Get user's recent activity feed
 *     description: Returns a combined, time-sorted list of the user's recent votes, comments, and donations.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of activities to return per category before merging
 *     responses:
 *       200:
 *         description: Activity feed retrieved successfully
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const userId = authUser.userId;

    const [votes, comments, donations] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, title: true } } },
      }),
      prisma.comment.findMany({
        where: { userId, deletedAt: null },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, title: true } },
          news: { select: { id: true, title: true } },
        },
      }),
      prisma.donation.findMany({
        where: { userId, status: DonationStatus.SUCCESS },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { project: { select: { id: true, title: true } } },
      }),
    ]);

    const activityFeed = [
      ...votes.map((vote) => ({
        id: `vote-${vote.id}`,
        type: `VOTE`,
        anction:
          vote.type === "UPVOTE" ? "Upvoted a project" : "Downvoted a project",
        targetTitle: vote.project.title,
        targetId: vote.project.id,
        createdAt: vote.createdAt,
      })),
      ...comments.map((comment) => ({
        id: `comment-${comment.id}`,
        type: "COMMENT",
        action: comment.projectId
          ? "Commented on a project"
          : "Commented on a news update",
        targetTitle: comment.project?.title || comment.news?.title || "Unknown",
        targetId: comment.projectId || comment.newsId,
        contentPreview:
          comment.text.substring(0, 50) +
          (comment.text.length > 50 ? "..." : ""),
        createdAt: comment.createdAt,
      })),
      ...donations.map((donation) => ({
        id: `donation-${donation.id}`,
        type: "DONATION",
        action: `Donated Rp ${donation.amount.toString()}`,
        targetTitle: donation.project.title,
        targetId: donation.projectId,
        createdAt: donation.createdAt,
      })),
    ];

    activityFeed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const recentActivities = activityFeed.slice(0, limit);

    return ok("Activity feed retrieved successfully", {
      data: recentActivities,
    });
  } catch (error) {
    console.error("GET user activity error", error);
    return internalError("An error occured fecthing the activity feed");
  }
}
