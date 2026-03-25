import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { VoteType } from "@/generated/prisma/enums";
import {
  badRequest,
  created,
  internalError,
  notFound,
  ok,
} from "@/lib/api-response";
import { z } from "zod/mini";

const voteSchema = z.object({
  projectId: z.uuid("Invalid ProjectId format. Must be a UUID"),
  userId: z.uuid("Invalid UserId format. Must be a UUID"),
  type: z.enum(VoteType, {
    error: "Invalid vote type. Must be UPVOTE or DOWNVOTE",
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return badRequest("Validation failed.", z.treeifyError(validation.error));
    }

    const { projectId, userId, type } = validation.data;

    const [project, user] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ]);

    if (!project) {
      return notFound("Project not found.");
    }

    if (!user) {
      return notFound("User not found.");
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === type) {
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });

        return ok(`Successfully removed ${type.toLowerCase()} (Toggle Off).`, {
          action: "DELETED",
        });
      } else {
        const updatedVote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: type },
        });

        return ok(`Successfully changed vote to ${type.toLowerCase()}.`, {
          action: "UPDATED",
          data: updatedVote,
        });
      }
    }

    const newVote = await prisma.vote.create({
      data: {
        projectId,
        userId,
        type,
      },
    });

    return created(`Successfully added new ${type.toLowerCase()}.`, {
      action: "CREATED",
      data: newVote,
    });
  } catch (error) {
    console.error("Voting API Error:", error);
    return internalError(
      "An internal server error occurred while processing the vote.",
    );
  }
}
