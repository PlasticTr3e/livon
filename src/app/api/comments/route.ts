import { NextResponse, NextRequest } from "next/server";
import { analyzeSentiment } from "../../../services/sentiment";
import prisma from "../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, userId, projectId, announcementId } = body;

    if (!text || !userId || (!projectId && !announcementId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Teks, userId, dan salah satu dari (projectId/announcementId) wajib diisi.",
        },
        { status: 400 },
      );
    }

    const { score, label } = analyzeSentiment(text);

    const newComment = await prisma.comment.create({
      data: {
        text,
        sentimentScore: score,
        sentimentLabel: label,
        userId,
        projectId: projectId ?? null,
        announcementId: announcementId ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Komentar berhasil diporses dan di simpan",
        data: newComment,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 },
    );
  }
}
