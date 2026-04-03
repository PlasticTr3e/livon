import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, internalError, notFound } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        agency: {
          select: {
            agencyProfile: {
              select: { agencyName: true, isVerified: true },
            },
          },
        },
        updates: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { votes: true, comments: true },
        },
      },
    });

    if (!project) return notFound("Project not found");

    return ok("Project details retrieved successfully", { data: project });
  } catch (error) {
    console.error("GET Project Details Error:", error);
    return internalError("An error occurred fetching project details");
  }
}
