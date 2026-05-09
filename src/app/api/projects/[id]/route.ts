// import { NextRequest } from "next/server";
// import prisma from "@/lib/prisma";
// import { ok, internalError, notFound, badRequest } from "@/lib/api-response";

// /**
//  * @swagger
//  * /api/projects/{id}:
//  *   get:
//  *     summary: Get project details
//  *     description: Fetch complete details of a project including its category, agency profile, updates, and counts (votes/comments).
//  *     tags: [Projects]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The UUID of the project
//  *     responses:
//  *       200:
//  *         description: Project details retrieved successfully
//  *       404:
//  *         description: Project not found
//  *       500:
//  *         description: Internal server error
//  */
// export async function GET(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;

//     const project = await prisma.project.findUnique({
//       where: { id, deletedAt: null },
//       include: {
//         category: true,
//         agency: {
//           select: {
//             agencyProfile: {
//               select: { agencyName: true, isVerified: true },
//             },
//           },
//         },
//         updates: {
//           orderBy: { createdAt: "desc" },
//         },
//         _count: {
//           select: { votes: true, comments: true },
//         },
//       },
//     });

//     if (!project) return notFound("Project not found");

//     return ok("Project details retrieved successfully", { data: project });
//   } catch (error) {
//     console.error("GET Project Details Error:", error);
//     return internalError("An error occurred fetching project details");
//   }
// }

// /**
//  * @swagger
//  * /api/projects/{id}:
//  *   patch:
//  *     summary: Update project status
//  *     description: Update the status of a project.
//  *     tags: [Projects]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The UUID of the project
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               status:
//  *                 type: string
//  *                 enum: [USULAN, DISETUJUI, BERJALAN, SELESAI]
//  *     responses:
//  *       200:
//  *         description: Project status updated successfully
//  *       400:
//  *         description: Invalid status provided
//  *       404:
//  *         description: Project not found
//  *       500:
//  *         description: Internal server error
//  */
// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   try {
//     const { id } = await params;
//     const body = await req.json();
//     const { status, notes } = body;

//     const validStatuses = ["USULAN", "DISETUJUI", "BERJALAN", "SELESAI"];
//     if (!validStatuses.includes(status)) {
//       return badRequest("Invalid status provided");
//     }

//     const project = await prisma.project.update({
//       where: { id },
//       data: {
//         status: status as "USULAN" | "DISETUJUI" | "BERJALAN" | "SELESAI",
//       },
//     });

//     if (notes) {
//       await prisma.projectUpdate.create({
//         data: {
//           projectId: id,
//           title: `Status diperbarui menjadi ${status}`,
//           description: notes,
//         },
//       });
//     }

//     return ok("Project status updated successfully", { data: project });
//   } catch (error: unknown) {
//     console.error("PATCH Project Error:", error);
//     if (error instanceof Error && "code" in error && error.code === "P2025") {
//       return notFound("Project not found");
//     }
//     return internalError("An error occurred updating project");
//   }
// }

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, internalError, notFound, badRequest } from "@/lib/api-response";
import { getAuthUser } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project details
 *     description: Fetch complete details of a project including its category, agency profile, updates, and counts (votes/comments).
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the project
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update project status
 *     description: Update the status of a project.
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [USULAN, DISETUJUI, BERJALAN, SELESAI]
 *     responses:
 *       200:
 *         description: Project status updated successfully
 *       400:
 *         description: Invalid status provided
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== Role.AGENCY) {
      return badRequest(
        "Unauthorized access. Cuma admin yang dapat mengubah status proyek.",
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ["USULAN", "DISETUJUI", "BERJALAN", "SELESAI"];
    if (!validStatuses.includes(status)) {
      return badRequest("Invalid status provided");
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        status: status as "USULAN" | "DISETUJUI" | "BERJALAN" | "SELESAI",
      },
    });

    if (notes) {
      await prisma.projectUpdate.create({
        data: {
          projectId: id,
          title: `Status diperbarui menjadi ${status}`,
          description: notes,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: authUser.userId,
        projectId: project.id,
        title: "Memperbarui Status Proyek",
        type: "ACTIVITY_LOG",
        message: `Anda telah memperbarui status proyek "${project.title}" menjadi ${status}.`,
      },
    });

    return ok("Project status updated successfully", { data: project });
  } catch (error: unknown) {
    console.error("PATCH Project Error:", error);
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      return notFound("Project not found");
    }
    return internalError("An error occurred updating project");
  }
}
