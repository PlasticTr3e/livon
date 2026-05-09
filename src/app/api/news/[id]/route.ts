import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, notFound } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get news details by ID
 *     description: Retrieve the details of a specific news or announcement, including author information and comment count. Accessible by anyone.
 *     tags:
 *       - News
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news article
 *     responses:
 *       200:
 *         description: Detail berita berhasil diambil
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
 *                   example: Detail berita berhasil diambil
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     content:
 *                       type: string
 *                     thumbnailUrl:
 *                       type: string
 *                       nullable: true
 *                     publishedAt:
 *                       type: string
 *                       format: date-time
 *                     author:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         agencyProfile:
 *                           type: object
 *                           properties:
 *                             agencyName:
 *                               type: string
 *                     _count:
 *                       type: object
 *                       properties:
 *                         comments:
 *                           type: integer
 *       404:
 *         description: Berita atau pengumuman tidak ditemukan
 *       400:
 *         description: Gagal mengambil detail berita
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const news = await prisma.news.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            agencyProfile: {
              select: {
                agencyName: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!news) {
      return notFound("Berita atau pengumuman tidak ditemukan.");
    }

    return ok("Detail berita berhasil diambil", { data: news });
  } catch (error: unknown) {
    console.error("[NEWS_DETAIL_GET]", error);
    return badRequest(
      "Gagal mengambil detail berita",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update a news article
 *     description: Update the title, content, thumbnail, or publish date of an existing news article. Only accessible by admins (AGENCY).
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news article to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Pengumuman Pemadaman Listrik Diperbarui"
 *               content:
 *                 type: string
 *                 example: "Update informasi pemadaman..."
 *               thumbnailUrl:
 *                 type: string
 *                 example: "https://example.com/new-image.jpg"
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-04-20T10:00:00Z"
 *     responses:
 *       200:
 *         description: Berita berhasil diperbarui
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
 *                   example: Berita berhasil diperbarui
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - missing token or user is not an AGENCY
 *       404:
 *         description: Berita yang ingin diubah tidak ditemukan
 *       400:
 *         description: Gagal memperbarui berita
 */
//
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized access. Cuma admin yang dapat mengubah berita.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    const body = await req.json();
    const { title, content, thumbnailUrl, publishedAt } = body;

    const existingNews = await prisma.news.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingNews) {
      return notFound("Berita yang ingin diubah tidak ditemukan.");
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(publishedAt !== undefined && {
          publishedAt: new Date(publishedAt),
        }),
      },
      include: {
        author: {
          select: { id: true, agencyProfile: { select: { agencyName: true } } },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        referenceId: updatedNews.id,
        title: "Memperbarui Berita",
        type: "ACTIVITY_LOG",
        message: `Anda telah memperbarui berita: ${updatedNews.title}`,
      },
    });

    return ok("Berita berhasil diperbarui", { data: updatedNews });
  } catch (error: unknown) {
    console.error("[NEWS_UPDATE_PUT]", error);
    return badRequest(
      "Gagal memperbarui berita",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete (soft delete) a news article
 *     description: Soft delete a news article by setting its deletedAt timestamp. Only accessible by admins (AGENCY).
 *     tags:
 *       - News
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the news article to delete
 *     responses:
 *       200:
 *         description: Berita berhasil dihapus (ditarik dari penayangan)
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
 *                   example: Berita berhasil dihapus (ditarik dari penayangan).
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Berita tidak ditemukan atau sudah dihapus sebelumnya
 *       400:
 *         description: Gagal menghapus berita
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 },
      );
    }

    const { id } = await params;

    const existingNews = await prisma.news.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingNews) {
      return notFound("Berita tidak ditemukan atau sudah dihapus sebelumnya.");
    }

    await prisma.news.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return ok("Berita berhasil dihapus (ditarik dari penayangan).");
  } catch (error) {
    console.error("[NEWS_DELETE]", error);
    return badRequest("Gagal menghapus berita", error);
  }
}
