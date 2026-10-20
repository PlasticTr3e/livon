import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { ok, badRequest, internalError } from "@/lib/api-response";
import { detectFileType, newUploadKey, putObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file/image to object storage
 *     description: |
 *       Accepts a multipart/form-data upload with a 'file' field and returns its public URL.
 *       Allowed types are JPEG, PNG, GIF, WebP, PDF, DOC, DOCX, XLSX, ZIP and DWG, detected from the file content.
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation failed or Unauthorized
 *       500:
 *         description: Internal server error or storage error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: You must be logged in to upload files.");
    }

    const limited = await rateLimit(RATE_LIMITS.upload, authUser.userId);
    if (limited) return limited;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return badRequest("No file found in form data with the key 'file'.");
    }

    if (file.size === 0) {
      return badRequest("File is empty.");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return badRequest(
        `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = detectFileType(buffer, file.name);
    if (!fileType) {
      return badRequest("Unsupported file type.");
    }

    const { key, url } = await putObject(
      newUploadKey(fileType.extension),
      buffer,
      fileType.contentType,
    );

    return ok("File uploaded successfully", {
      data: { url, path: key },
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return internalError("An internal server error occured while uploading.");
  }
}
