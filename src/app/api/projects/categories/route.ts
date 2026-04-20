import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ok, created, badRequest } from "@/lib/api-response";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/projects/categories:
 *   get:
 *     summary: Get all project categories
 *     description: Retrieve a list of all project categories ordered alphabetically.
 *     tags:
 *       - Project Categories
 *     responses:
 *       200:
 *         description: Project categories retrieved successfully
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
 *                   example: Project categories retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "cat-123"
 *                       name:
 *                         type: string
 *                         example: "Infrastruktur"
 *       400:
 *         description: Failed to retrieve project categories
 */
export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.projectCategory.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return ok("Project categories retrieved successfully", {
      data: categories,
    });
  } catch (error: unknown) {
    console.error("[PROJECT_CATEGORIES_GET]", error);
    return badRequest(
      "Failed to retrieve project categories",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

/**
 * @swagger
 * /api/projects/categories:
 *   post:
 *     summary: Create a new project category
 *     description: Create a new project category. Only accessible by admins (AGENCY role).
 *     tags:
 *       - Project Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the new category
 *                 example: "Kesehatan"
 *     responses:
 *       201:
 *         description: Project category created successfully
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
 *                   example: Project category created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Bad request - missing name or category already exists
 *       401:
 *         description: Unauthorized - missing token or insufficient role
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    if (!authUser || authUser.role !== Role.AGENCY) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized access. Only admins can create categories.",
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return badRequest(
        "Category name is required and must be a valid string.",
      );
    }

    const existingCategory = await prisma.projectCategory.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return badRequest("A project category with this name already exists.");
    }

    const newCategory = await prisma.projectCategory.create({
      data: {
        name: name.trim(),
      },
    });

    return created("Project category created successfully", {
      data: newCategory,
    });
  } catch (error: unknown) {
    console.error("[PROJECT_CATEGORIES_POST]", error);
    return badRequest(
      "Failed to create project category",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
