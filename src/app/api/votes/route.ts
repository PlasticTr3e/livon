import { NextResponse, NextRequest } from "next/server";
import prisma from "../../../lib/prisma";
import { VoteType } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, type } = body;

    if (!projectId || !userId || !type) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: projectId, userId, and type are required.",
        },
        { status: 400 },
      );
    }

    if (type !== VoteType.UPVOTE && type !== VoteType.DOWNVOTE) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid vote type. Must be UPVOTE or DOWNVOTE.",
        },
        { status: 400 },
      );
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

        return NextResponse.json(
          {
            success: true,
            message: `Successfully removed ${type.toLowerCase()} (Toggle Off).`,
            action: "DELETED",
          },
          { status: 200 },
        );
      } else {
        const updatedVote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: type },
        });

        return NextResponse.json(
          {
            success: true,
            message: `Successfully changed vote to ${type.toLowerCase()}.`,
            action: "UPDATED",
            data: updatedVote,
          },
          { status: 200 },
        );
      }
    }

    const newVote = await prisma.vote.create({
      data: {
        projectId,
        userId,
        type,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully added new ${type.toLowerCase()}.`,
        action: "CREATED",
        data: newVote,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Voting API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "An internal server error occurred while processing the vote.",
      },
      { status: 500 },
    );
  }
}
