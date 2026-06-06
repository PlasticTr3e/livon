import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { VoteType, Role } from "@/generated/prisma/enums";
import { getAuthUser } from "@/lib/auth";
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
  type: z.enum(VoteType, {
    error: "Invalid vote type. Must be UPVOTE or DOWNVOTE",
  }),
});

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Upvote or Downvote a project
 *     description: Toggles a user's vote on a specific project. Requires Citizen Role.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - type
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [UPVOTE, DOWNVOTE]
 *     responses:
 *       200:
 *         description: Vote updated or toggled off successfully
 *       201:
 *         description: Vote created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Project or User not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.role !== Role.WARGA) {
      return badRequest("Forbidden: Only Citizens (WARGA) can vote");
    }

    const body = await request.json();

    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return badRequest("Validation failed.", z.treeifyError(validation.error));
    }

    const { projectId, type } = validation.data;
    const userId = authUser.userId;

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
