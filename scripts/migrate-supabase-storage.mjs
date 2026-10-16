// Copies the old Supabase buckets into MinIO and rewrites stored supabase.co URLs to /media/legacy/<bucket>/<path>.
// Usage: node --env-file=.env scripts/migrate-supabase-storage.mjs [--dry-run]. Safe to re-run.

import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import pg from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const SOURCE_BUCKETS = (
  process.env.SUPABASE_BUCKETS || "livon-media-prod,livon-media-dev"
).split(",");
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_BUCKET = process.env.S3_BUCKET || "livon-media";
const MEDIA_BASE_PATH = process.env.MEDIA_BASE_PATH || "/media";
const URL_PATTERN =
  "https?://[a-z0-9-]+\\.supabase\\.co/storage/v1/object/public/([^/]+)/([^\\s\"'<>)]+)";
const URL_REPLACEMENT = `${MEDIA_BASE_PATH}/legacy/\\1/\\2`;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
})) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const supabaseHeaders = {
  Authorization: `Bearer ${SUPABASE_KEY}`,
  apikey: SUPABASE_KEY,
};

async function listObjects(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/${bucket}`,
      {
        method: "POST",
        headers: { ...supabaseHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ prefix, limit: 1000, offset }),
      },
    );
    if (!res.ok) {
      throw new Error(
        `List ${bucket}/${prefix} failed: ${res.status} ${await res.text()}`,
      );
    }
    const entries = await res.json();
    for (const entry of entries) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Supabase returns folders as entries without an id.
      if (entry.id === null) files.push(...(await listObjects(bucket, path)));
      else files.push({ path, contentType: entry.metadata?.mimetype });
    }
    if (entries.length < 1000) return files;
  }
}

async function existsInMinio(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: TARGET_BUCKET, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

async function copyBucket(bucket) {
  const objects = await listObjects(bucket);
  let copied = 0;
  let skipped = 0;

  for (const { path, contentType } of objects) {
    const key = `legacy/${bucket}/${path}`;
    if (await existsInMinio(key)) {
      skipped++;
      continue;
    }
    if (DRY_RUN) {
      copied++;
      continue;
    }

    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`,
      { headers: supabaseHeaders },
    );
    if (!res.ok)
      throw new Error(`Download ${bucket}/${path} failed: ${res.status}`);

    await s3.send(
      new PutObjectCommand({
        Bucket: TARGET_BUCKET,
        Key: key,
        Body: Buffer.from(await res.arrayBuffer()),
        ContentType:
          contentType ||
          res.headers.get("content-type") ||
          "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    copied++;
  }

  console.log(
    `${bucket}: ${objects.length} objects, ${copied} ${DRY_RUN ? "to copy" : "copied"}, ${skipped} already present`,
  );
}

async function rewriteUrls() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const { rows: columns } = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (data_type IN ('text', 'character varying')
          OR (data_type = 'ARRAY' AND udt_name IN ('_text', '_varchar')))
    `);

    await client.query("BEGIN");
    for (const { table_name, column_name, data_type } of columns) {
      const table = `"${table_name}"`;
      const column = `"${column_name}"`;
      const isArray = data_type === "ARRAY";
      const matches = isArray
        ? `EXISTS (SELECT 1 FROM unnest(${column}) v WHERE v ~ $1)`
        : `${column} ~ $1`;

      if (DRY_RUN) {
        const { rows } = await client.query(
          `SELECT count(*)::int AS n FROM ${table} WHERE ${matches}`,
          [URL_PATTERN],
        );
        if (rows[0].n)
          console.log(
            `${table_name}.${column_name}: ${rows[0].n} rows to rewrite`,
          );
        continue;
      }

      const newValue = isArray
        ? `ARRAY(SELECT regexp_replace(v, $1, $2, 'g') FROM unnest(${column}) WITH ORDINALITY AS t(v, i) ORDER BY i)`
        : `regexp_replace(${column}, $1, $2, 'g')`;
      const { rowCount } = await client.query(
        `UPDATE ${table} SET ${column} = ${newValue} WHERE ${matches}`,
        [URL_PATTERN, URL_REPLACEMENT],
      );
      if (rowCount)
        console.log(`${table_name}.${column_name}: ${rowCount} rows rewritten`);
    }
    await client.query(DRY_RUN ? "ROLLBACK" : "COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

for (const bucket of SOURCE_BUCKETS) await copyBucket(bucket);
await rewriteUrls();
console.log(
  DRY_RUN ? "Dry run finished, nothing was written." : "Migration finished.",
);
