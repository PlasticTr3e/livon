import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";
import { badRequest, ok, internalError } from "@/lib/api-response";
import { DonationStatus, Role } from "@/generated/prisma/enums";
import { getAuthUser } from "@/lib/auth";

type ActivityItem = {
  id: string;
  type: string;
  action: string;
  targetTitle?: string;
  targetId?: string | null;
  contentPreview?: string;
  source?: string;
  createdAt: Date;
};

/**
 * @swagger
 * /api/users/activity:
 *   get:
 *     summary: Get recent activity feed (role-aware)
 *     description: |
 *       Returns a combined, time-sorted activity feed based on authenticated user role.
 *
 *       - For AGENCY:
 *         - PROJECT_CREATED
 *         - PROJECT_UPDATED
 *         - NEWS_CREATED
 *         - NEWS_UPDATED
 *         - WARGA_VERIFIED (only citizens verified by this agency)
 *
 *       - For WARGA:
 *         - NEW_PROJECT
 *         - NEW_NEWS
 *         - VOTE
 *         - COMMENT
 *         - DONATION
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *         description: Maximum number of activities returned after merge and sort
 *     responses:
 *       200:
 *         description: Activity feed retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Activity feed retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: project-created-abc123
 *                       type:
 *                         type: string
 *                         enum:
 *                           - PROJECT_CREATED
 *                           - PROJECT_UPDATED
 *                           - NEWS_CREATED
 *                           - NEWS_UPDATED
 *                           - WARGA_VERIFIED
 *                           - NEW_PROJECT
 *                           - NEW_NEWS
 *                           - VOTE
 *                           - COMMENT
 *                           - DONATION
 *                       action:
 *                         type: string
 *                         example: Created a project
 *                       targetTitle:
 *                         type: string
 *                         nullable: true
 *                       targetId:
 *                         type: string
 *                         nullable: true
 *                       contentPreview:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Unauthorized or invalid user role
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
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;

    if (authUser.role === Role.AGENCY) {
      return getAgencyActivity(authUser.userId, safeLimit);
    }

    if (authUser.role === Role.WARGA) {
      return getWargaActivity(authUser.userId, safeLimit);
    }

    return badRequest("Invalid user role");
  } catch (error) {
    console.error("GET user activity error", error);
    return internalError("An error occurred fetching the activity feed");
  }
}

async function getAgencyActivity(userId: string, limit: number) {
  const agencyProfile = await prisma.agencyProfile.findUnique({
    where: { userId },
    select: { id: true, agencyName: true },
  });

  if (!agencyProfile) {
    return badRequest("Agency profile not found");
  }

  const [
    createdProjects,
    projectUpdates,
    createdNews,
    updatedNews,
    verifiedCitizens,
  ] = await Promise.all([
    prisma.project.findMany({
      where: { agencyId: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.projectUpdate.findMany({
      where: {
        project: { agencyId: userId },
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.news.findMany({
      where: { createdById: userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.news.findMany({
      where: { createdById: userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    }),
    prisma.citizenProfile.findMany({
      where: {
        isVerified: true,
        verifiedBy: agencyProfile.id,
      },
      orderBy: { verifiedAt: "desc" },
      take: limit,
      select: {
        id: true,
        fullName: true,
        verifiedAt: true,
        user: { select: { id: true, email: true } },
      },
    }),
  ]);

  const activityFeed: ActivityItem[] = [
    ...createdProjects.map((p) => ({
      id: `project-created-${p.id}`,
      type: "PROJECT_CREATED",
      action: "Created a project",
      targetTitle: p.title,
      targetId: p.id,
      createdAt: p.createdAt,
    })),
    ...projectUpdates.map((u) => ({
      id: `project-updated-${u.id}`,
      type: "PROJECT_UPDATED",
      action: "Updated a project",
      targetTitle: u.project.title,
      targetId: u.project.id,
      contentPreview: u.title,
      createdAt: u.createdAt,
    })),
    ...createdNews.map((n) => ({
      id: `news-created-${n.id}`,
      type: "NEWS_CREATED",
      action: "Created news",
      targetTitle: n.title,
      targetId: n.id,
      createdAt: n.createdAt,
    })),
    ...updatedNews
      .filter((n) => n.updatedAt.getTime() > n.createdAt.getTime())
      .map((n) => ({
        id: `news-updated-${n.id}-${n.updatedAt.getTime()}`,
        type: "NEWS_UPDATED",
        action: "Updated news",
        targetTitle: n.title,
        targetId: n.id,
        createdAt: n.updatedAt,
      })),
    ...verifiedCitizens.map((c) => ({
      id: `citizen-verified-${c.id}-${c.verifiedAt?.getTime() ?? 0}`,
      type: "WARGA_VERIFIED",
      action: "Verified warga",
      targetTitle: c.fullName,
      targetId: c.user.id,
      contentPreview: c.user.email,
      createdAt: c.verifiedAt ?? new Date(0),
    })),
  ];

  activityFeed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return ok("Activity feed retrieved successfully", {
    data: activityFeed.slice(0, limit),
  });
}

async function getWargaActivity(userId: string, limit: number) {
  const [votes, comments, donations, newProjects, newNews] = await Promise.all([
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
    prisma.project.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.news.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const activityFeed: ActivityItem[] = [
    ...votes.map((vote) => ({
      id: `vote-${vote.id}`,
      type: "VOTE",
      action:
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
        comment.text.substring(0, 50) + (comment.text.length > 50 ? "..." : ""),
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
    ...newProjects.map((project) => ({
      id: `new-project-${project.id}`,
      type: "NEW_PROJECT",
      action: "New project published",
      targetTitle: project.title,
      targetId: project.id,
      createdAt: project.createdAt,
    })),
    ...newNews.map((news) => ({
      id: `new-news-${news.id}`,
      type: "NEW_NEWS",
      action: "New news published",
      targetTitle: news.title,
      targetId: news.id,
      createdAt: news.createdAt,
    })),
  ];

  activityFeed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return ok("Activity feed retrieved successfully", {
    data: activityFeed.slice(0, limit),
  });
}
