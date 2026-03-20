import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeSentiment } from "@/services/sentiment";
import { z } from "zod";

const commentSchema = z
  .object({
    text: z
      .string()
      .min(1, "Comment text cannot be empty.")
      .max(1000, "Comment is too long."),
    userId: z.uuid("Invalid user ID format."),
    projectId: z.uuid("Invalid project ID format.").optional(),
    announcementId: z.uuid("Invalid announcement ID format.").optional(),
    parentId: z.uuid("Invalid parent comment ID format.").optional(),
  })
  .refine((data) => data.projectId || data.announcementId, {
    message:
      "A comment must belong to either a projectId or an announcementId.",
    path: ["projectId"],
  });

const getCommentSchema = z
  .object({
    projectId: z.uuid("Invalid project ID format.").optional(),
    announcementId: z.uuid("Invalid announcement ID format.").optional(),
  })
  .refine((data) => Boolean(data.projectId) !== Boolean(data.announcementId), {
    message: "Provide exactly one of projectId or announcementId.",
    path: ["projectId"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed.",
          errors: z.treeifyError(validation.error),
        },
        { status: 400 },
      );
    }

    const { text, userId, projectId, announcementId, parentId } =
      validation.data;

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            message: "Parent comment not found. Cannot create reply.",
          },
          { status: 404 },
        );
      }

      if (parentComment.parentId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Maximum thread depth reached. You cannot reply to a reply.",
          },
          { status: 400 },
        );
      }
    }

    const { score, label } = analyzeSentiment(text);

    const newComment = await prisma.comment.create({
      data: {
        text,
        userId,
        projectId: projectId || null,
        announcementId: announcementId || null,
        parentId: parentId || null,
        sentimentScore: score,
        sentimentLabel: label,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: parentId
          ? "Reply successfully posted."
          : "Main comment successfully posted.",
        data: newComment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Comment API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "An internal server error occurred while processing the comment.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const announcementId = searchParams.get("announcementId") ?? undefined;

    const validation = getCommentSchema.safeParse({
      projectId,
      announcementId,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "invalid query params",
          error: z.treeifyError(validation.error),
        },
        { status: 400 },
      );
    }

    const validData = validation.data;

    const comments = await prisma.comment.findMany({
      where: {
        ...(validData.projectId ? { projectId: validData.projectId } : {}),
        ...(validData.announcementId
          ? { announcementId: validData.announcementId }
          : {}),

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

    return NextResponse.json(
      {
        success: true,
        message: "Comments fecthed succesfully.",
        data: comments,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch Comments API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while fetching comments.",
      },
      { status: 500 },
    );
  }
}
