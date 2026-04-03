import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeSentiment } from "@/services/sentiment";
import {
  badRequest,
  created,
  internalError,
  notFound,
  ok,
} from "@/lib/api-response";
import { z } from "zod";

const commentSchema = z
  .object({
    text: z
      .string()
      .min(1, "Comment text cannot be empty.")
      .max(1000, "Comment is too long."),
    userId: z.uuid("Invalid user ID format."),
    projectId: z.uuid("Invalid project ID format.").optional(),
    newsId: z.uuid("Invalid news ID format.").optional(),
    parentId: z.uuid("Invalid parent comment ID format.").optional(),
  })
  .refine((data) => Boolean(data.projectId) !== Boolean(data.newsId), {
    message: "Provide exactly one of projectId or newsId.",
    path: ["projectId"],
  });

const getCommentSchema = z
  .object({
    projectId: z.uuid("Invalid project ID format.").optional(),
    newsId: z.uuid("Invalid news ID format.").optional(),
  })
  .refine((data) => Boolean(data.projectId) !== Boolean(data.newsId), {
    message: "Provide exactly one of projectId or newsId.",
    path: ["projectId"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return badRequest("Validation failed.", z.treeifyError(validation.error));
    }

    const { text, userId, projectId, newsId, parentId } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return notFound("User not found.");
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        return notFound("Project not found.");
      }
    }

    if (newsId) {
      const news = await prisma.news.findUnique({
        where: { id: newsId },
        select: { id: true },
      });

      if (!news) {
        return notFound("News not found.");
      }
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return notFound("Parent comment not found. Cannot create reply.");
      }

      if (parentComment.parentId) {
        return badRequest(
          "Maximum thread depth reached. You cannot reply to a reply.",
        );
      }

      const sameProjectTarget = parentComment.projectId === (projectId ?? null);
      const sameNewsTarget = parentComment.newsId === (newsId ?? null);

      if (!sameProjectTarget || !sameNewsTarget) {
        return badRequest(
          "Reply target must match the same project or news as the parent comment.",
        );
      }
    }

    const { score, label } = analyzeSentiment(text);

    const newComment = await prisma.comment.create({
      data: {
        text,
        userId,
        projectId: projectId ?? null,
        newsId: newsId ?? null,
        parentId: parentId || null,
        sentimentScore: score,
        sentimentLabel: label,
      },
    });

    return created(
      parentId
        ? "Reply successfully posted."
        : "Main comment successfully posted.",
      { data: newComment },
    );
  } catch (error) {
    console.error("Comment API Error:", error);
    return internalError(
      "An internal server error occurred while processing the comment.",
    );
  }
}

/**
 * @swagger
 * /api/projects:
 *   get:
 *     description: Returns a projects
 *     responses:
 *       200:
 *         description: Success
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const newsId = searchParams.get("newsId") ?? undefined;

    const validation = getCommentSchema.safeParse({
      projectId,
      newsId,
    });

    if (!validation.success) {
      return badRequest(
        "Invalid query params.",
        z.treeifyError(validation.error),
      );
    }

    const validData = validation.data;

    const comments = await prisma.comment.findMany({
      where: {
        ...(validData.projectId ? { projectId: validData.projectId } : {}),
        ...(validData.newsId ? { newsId: validData.newsId } : {}),
        parentId: null,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        user: {
          select: {
            id: true,
            citizenProfile: {
              select: { fullName: true },
            },
          },
        },

        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                citizenProfile: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
      },
    });

    return ok("Comments fetched successfully.", { data: comments });
  } catch (error) {
    console.error("Fetch Comments API Error:", error);
    return internalError(
      "An internal server error occurred while fetching comments.",
    );
  }
}
