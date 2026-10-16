import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET || "livon-media";
const mediaBasePath = (process.env.MEDIA_BASE_PATH || "/media").replace(
  /\/$/,
  "",
);

const globalForStorage = global as unknown as { s3?: S3Client };

function getClient() {
  if (!globalForStorage.s3) {
    globalForStorage.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
      region: process.env.S3_REGION || "us-east-1",
      // MinIO serves buckets by path, not by subdomain.
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || "",
      },
    });
  }
  return globalForStorage.s3;
}

export function publicUrlFor(key: string) {
  return `${mediaBasePath}/${key}`;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { key, url: publicUrlFor(key) };
}

export function newUploadKey(extension: string) {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${now.getUTCFullYear()}/${month}/${randomUUID()}.${extension}`;
}

type DetectedType = { extension: string; contentType: string };

const OFFICE_ZIP_TYPES: Record<string, DetectedType> = {
  docx: {
    extension: "docx",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  xlsx: {
    extension: "xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
};

function startsWith(buffer: Buffer, bytes: number[], offset = 0) {
  return bytes.every((byte, i) => buffer[offset + i] === byte);
}

/**
 * Detects the file type from its leading bytes so the client-supplied
 * MIME type and extension are never trusted. SVG is rejected on purpose: it can carry script.
 */
export function detectFileType(
  buffer: Buffer,
  originalName: string,
): DetectedType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff]))
    return { extension: "jpg", contentType: "image/jpeg" };
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { extension: "png", contentType: "image/png" };
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38]))
    return { extension: "gif", contentType: "image/gif" };
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return { extension: "webp", contentType: "image/webp" };
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return { extension: "pdf", contentType: "application/pdf" };
  if (startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    return { extension: "doc", contentType: "application/msword" };
  if (startsWith(buffer, [0x41, 0x43, 0x31, 0x30]))
    return { extension: "dwg", contentType: "image/vnd.dwg" };
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    // docx and xlsx are zip containers, so the extension decides between them.
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
    return (
      OFFICE_ZIP_TYPES[ext] ?? {
        extension: "zip",
        contentType: "application/zip",
      }
    );
  }
  return null;
}
