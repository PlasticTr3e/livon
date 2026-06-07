import { NextRequest } from "next/server";
import { treeifyError, z } from "zod";
import prisma from "@/lib/prisma";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { analyzeSentiment } from "@/services/sentiment";

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Get comments for a project or news
 *     description: Retrieve threaded comments associated with either a projectId or newsId.
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: The ID of the project to fetch comments for.
 *       - in: query
 *         name: newsId
 *         schema:
 *           type: string
 *         description: The ID of the news article to fetch comments for.
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       400:
 *         description: Missing projectId or newsId
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const newsId = searchParams.get("newsId");

    if (!projectId && !newsId) {
      return badRequest("Either projectId or newsId must be provided");
    }

    const comments = await prisma.comment.findMany({
      where: {
        projectId: projectId ?? undefined,
        newsId: newsId ?? undefined,
        parentId: null,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, email: true, role: true } },
        replies: {
          include: { user: { select: { id: true, email: true, role: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok("Comments retrieved successfully", { data: comments });
  } catch (error: unknown) {
    console.error("GET Comments Error:", error);
    return internalError("An error occurred fetching comments");
  }
}

const commentSchema = z
  .object({
    projectId: z.string().optional(),
    newsId: z.string().optional(),
    text: z.string().min(1, "Comment text is required"),
    parentId: z.string().optional(),
  })
  .refine((data) => data.projectId !== undefined || data.newsId !== undefined, {
    message: "Either projectId or newsId must be provided",
  });

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Post a comment
 *     description: Submit a new comment on a project or news post. Also triggers sentiment analysis.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               projectId:
 *                 type: string
 *               newsId:
 *                 type: string
 *               text:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation failed or Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser)
      return badRequest("Unauthorized: You must be logged in to comment");

    const body: unknown = await req.json();
    const result = commentSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", treeifyError(result.error));

    const sentiment = await analyzeSentiment(result.data.text);

    const newComment = await prisma.comment.create({
      data: {
        userId: authUser.userId,
        projectId: result.data.projectId,
        newsId: result.data.newsId,
        text: result.data.text,
        parentId: result.data.parentId,
        sentimentLabel: sentiment.label,
        sentimentScore: sentiment.score,
      },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    });

    if (result.data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: result.data.parentId },
        select: { userId: true },
      });

      if (parentComment && parentComment.userId !== authUser.userId) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            projectId: result.data.projectId,
            referenceId: newComment.id,
            title: "New Reply",
            type: "COMMENT_REPLY",
            message: "Someone replied to your comment.",
          },
        });
      }
    }

    return created("Comment created successfully", { data: newComment });
  } catch (error: unknown) {
    console.error("POST Comment Error:", error);
    return internalError("An error occurred creating the comment");
  }
}
