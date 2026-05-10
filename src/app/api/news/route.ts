import { NextRequest } from "next/server";
import z from "zod";
import prisma from "@/lib/prisma";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get news feed
 *     description: Retrieves a paginated list of news and announcements.
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: News retrieved successfully
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [news, totalCount] = await Promise.all([
      prisma.news.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              agencyProfile: {
                select: { agencyName: true, isVerified: true },
              },
            },
          },
        },
      }),
      prisma.news.count({ where: { deletedAt: null } }),
    ]);

    return ok("News retrived successfully", {
      data: {
        items: news,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET News Error:", error);
    return internalError("An error occured feching news");
  }
}

const createNewsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().optional(),
  thumbnailUrl: z.url("Must be a valid URL").optional().or(z.literal("")),
});

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Publish news announcement (Agency only)
 *     description: Allows an Agency to publish environmental updates or general news.
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: News published successfully
 *       400:
 *         description: Validation failed or Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest("Forbidden: Only Agencies can publish news");
    }

    const body = await req.json();
    const result = createNewsSchema.safeParse(body);
    if (!result.success)
      return badRequest("Validation failed", z.treeifyError(result.error));

    const { title, content, thumbnailUrl } = result.data;

    const newsItem = await prisma.news.create({
      data: {
        title,
        content,
        thumbnailUrl: thumbnailUrl || null,
        createdById: authUser.userId,
        publishedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        referenceId: newsItem.id,
        title: "Membuat Berita",
        type: "ACTIVITY_LOG",
        message: `Anda telah mempublikasikan berita baru : ${newsItem.title}`,
      },
    });

    const wargaUsers = await prisma.user.findMany({
      where: { role: Role.WARGA },
      select: { id: true },
    });

    if (wargaUsers.length > 0) {
      const wargaNotifications = wargaUsers.map((user) => ({
        userId: user.id,
        referenceId: newsItem.id,
        title: "Berita Baru !",
        type: "NEW_NEWS",
        message: `Ada berita terbaru : ${newsItem.title}. Yuk baca selengkapnya!`,
      }));

      await prisma.notification.createMany({
        data: wargaNotifications,
      });
    }

    return created("News published successfully", { data: newsItem });
  } catch (error) {
    console.error("POST News Error", error);
    return internalError("An error occured publishing news");
  }
}
