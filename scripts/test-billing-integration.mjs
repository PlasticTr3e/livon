import fs from "node:fs";
import { spawnSync } from "node:child_process";
import "dotenv/config";
const target = new URL(process.env.DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  !target.pathname.endsWith("-dev")
)
  throw new Error(
    "Billing integration tests require a local development database.",
  );
fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync(
  "tmp/billing-test-schema.prisma",
  fs
    .readFileSync("prisma/schema.prisma", "utf8")
    .replace(
      'provider        = "prisma-client"',
      'provider        = "prisma-client-js"',
    )
    .replace(
      'output          = "../src/generated/prisma"',
      'output          = "./billing-test-client"',
    ),
);
const generated = spawnSync(
  process.execPath,
  [
    "node_modules/prisma/build/index.js",
    "generate",
    "--schema",
    "tmp/billing-test-schema.prisma",
  ],
  { stdio: "inherit" },
);
if (generated.status !== 0) process.exit(generated.status || 1);
const result = spawnSync(
  process.execPath,
  ["--test", "tests/billing-payment.integration.test.mjs"],
  { stdio: "inherit", env: { ...process.env, LIVON_RUN_DB_TESTS: "1" } },
);
process.exitCode = result.status || 0;
