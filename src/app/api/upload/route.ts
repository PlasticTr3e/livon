import { supabase } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { ok, badRequest, internalError } from "@/lib/api-response";

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file/image to Supabase
 *     description: Accepts a multipart/form-data upload with a 'file' field and returns the public URL.
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
 *         description: Internal server error or Supabase error
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return badRequest("Unauthorized: You must be logged in to upload files.");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return badRequest("No file found in form data with the key 'file'.");
    }

    if (file.size === 0) {
      return badRequest("File is empty.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const BUCKET_NAME =
      process.env.NODE_ENV === "production"
        ? "livon-media-prod"
        : "livon-media-dev";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`uploads/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Upload Error", uploadError);
      return internalError(`Supabase error: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`uploads/${fileName}`);

    return ok("File uploaded successfully", {
      data: { url: publicUrl, path: uploadData?.path || "" },
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return internalError("An internal server error occured while uploading.");
  }
}
