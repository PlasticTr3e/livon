import { NextRequest } from "next/server";
import { treeifyError } from "zod";
import { ok, created, badRequest, internalError } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import {
  createPostSchema,
  postQuerySchema,
} from "@/services/community/community-schema";
import {
  createCommunityPost,
  getCommunityPosts,
} from "@/services/community/community-service";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/community/posts:
 *   get:
 *     summary: Get community posts feed
 *     description: Retrieves a paginated list of community posts ordered by creation time descending with optional text search (?search=). Accessible by both citizens and admins.
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for post content or author name
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
 *           default: 20
 *         description: Number of items per page (maximum 100)
 *     responses:
 *       200:
 *         description: Community posts retrieved successfully
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const { searchParams } = new URL(req.url);

    const query = postQuerySchema.parse({
      search: searchParams.get("search") || searchParams.get("q") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    const result = await getCommunityPosts(query, authUser?.userId);

    return ok("Community posts retrieved successfully", {
      data: {
        posts: result.posts,
        items: result.posts,
        pagination: {
          total: result.total,
          page: result.page,
          limit: query.limit,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error: unknown) {
    console.error("GET Community Posts Error:", error);
    return internalError("An error occurred while fetching community posts.");
  }
}

/**
 * @swagger
 * /api/community/posts:
 *   post:
 *     summary: Create a new community post
 *     description: Creates a community post with text, optional images (max 5), and thread items support. Accessible by citizens and admins.
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Community garden harvest report: All fresh vegetables are ready for distribution!"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 5
 *                 description: List of image URLs (maximum 5)
 *               threadItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                       nullable: true
 *                 description: Optional thread items
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Validation failed or unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: You must be logged in to create a post");
    }

    const body: unknown = await req.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return badRequest("Validation failed", treeifyError(validation.error));
    }

    const post = await createCommunityPost(authUser.userId, validation.data);

    return created("Post created successfully", { data: post });
  } catch (error: unknown) {
    console.error("POST Community Post Error:", error);
    return internalError("An error occurred while creating the post.");
  }
}
