import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest } from "@/lib/api-response";
import { Role, SentimentLabel, ProjectStatus } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/projects/priority:
 *   get:
 *     summary: Get project priorities and sentiment analytics
 *     description: Retrieve a list of active projects (USULAN, BERJALAN, DISETUJUI) sorted by their urban priority score. Includes vote counts and sentiment analytics calculation from their comments. Only accessible by admins (AGENCY).
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project priority retrieved successfully
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
 *                   example: Project priority retrived
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "proj-123"
 *                       title:
 *                         type: string
 *                         example: "Perbaikan Jalan Sudirman"
 *                       status:
 *                         type: string
 *                         description: Current status of the project
 *                         example: "USULAN"
 *                       urbanPriorityScore:
 *                         type: number
 *                         example: 85.5
 *                       totalVotes:
 *                         type: integer
 *                         example: 124
 *                       sentimentAnalytics:
 *                         type: object
 *                         properties:
 *                           totalAnalyzed:
 *                             type: integer
 *                             example: 45
 *                           distribution:
 *                             type: object
 *                             properties:
 *                               positive:
 *                                 type: integer
 *                                 example: 30
 *                               negative:
 *                                 type: integer
 *                                 example: 5
 *                               neutral:
 *                                 type: integer
 *                                 example: 10
 *                           averageScore:
 *                             type: number
 *                             example: 0.75
 *       401:
 *         description: Unauthorized access - missing token or user is not an AGENCY
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       400:
 *         description: Error occurs when trying to get project priority
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Error occure when try to get project priority
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 },
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [
            ProjectStatus.USULAN,
            ProjectStatus.BERJALAN,
            ProjectStatus.DISETUJUI,
          ],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priorityScore: true,
        _count: {
          select: { votes: true },
        },
        comments: {
          select: {
            sentimentLabel: true,
            sentimentScore: true,
          },
          where: {
            deletedAt: null,
            sentimentLabel: { not: null },
          },
        },
      },
      orderBy: {
        priorityScore: "desc",
      },
    });

    const projectsWithAnalytics = projects.map((project) => {
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      let totalSentimentScore = 0;

      project.comments.forEach((comment) => {
        if (comment.sentimentLabel === SentimentLabel.POSITIF) positiveCount++;
        else if (comment.sentimentLabel === SentimentLabel.NEGATIF)
          negativeCount++;
        else if (comment.sentimentLabel === SentimentLabel.NETRAL)
          neutralCount++;

        if (comment.sentimentScore) {
          totalSentimentScore += comment.sentimentScore;
        }
      });

      const totalCommentsWithSentiment = project.comments.length;
      const averageSentimentScore =
        totalCommentsWithSentiment > 0
          ? totalSentimentScore / totalCommentsWithSentiment
          : 0;

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        urbanPriorityScore: project.priorityScore ?? 0,
        totalVotes: project._count.votes,
        sentimentAnalytics: {
          totalAnalyzed: totalCommentsWithSentiment,
          distribution: {
            positive: positiveCount,
            negative: negativeCount,
            neutral: neutralCount,
          },
          averageScore: Number(averageSentimentScore.toFixed(2)),
        },
      };
    });

    return ok("Project priority retrived", {
      data: projectsWithAnalytics,
    });
  } catch (error: unknown) {
    console.error("[PROJECT_PRIORITY_GET]", error);
    return badRequest("Error occure when try to get project priority", error);
  }
}
