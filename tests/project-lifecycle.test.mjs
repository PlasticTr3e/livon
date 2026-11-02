import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const nativeRequire = createRequire(import.meta.url);
const cache = new Map();
let fetchHandler;

function load(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const testModule = { exports: {} };
  cache.set(filename, testModule);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const require = (name) => {
    if (name.startsWith("@/")) return load("src/" + name.slice(2) + ".ts");
    if (name.startsWith("."))
      return load(
        path.relative(
          projectRoot,
          path.resolve(path.dirname(filename), name + ".ts"),
        ),
      );
    return nativeRequire(name);
  };
  vm.runInNewContext(
    code,
    {
      module: testModule,
      exports: testModule.exports,
      require,
      console,
      Intl,
      fetch: (...args) => fetchHandler(...args),
    },
    { filename },
  );
  return testModule.exports;
}

const lifecycle = load("src/lib/project-lifecycle.ts");
const map = load("src/lib/map/map-format.ts");
const admin = load("src/lib/admin-projects/admin-projects-format.ts");
const sentiment = load("src/lib/project-sentiment.ts");
const mapApi = load("src/lib/map/map-api.ts");

test("project stages expose exactly planning, construction, and completion", () => {
  assert.deepEqual(Array.from(lifecycle.PROJECT_STAGES), [
    "Planning",
    "Under Construction",
    "Completed",
  ]);
  assert.deepEqual(Array.from(map.MAP_STATUS_FILTERS), [
    "All",
    ...lifecycle.PROJECT_STAGES,
  ]);
  assert.deepEqual(Array.from(admin.ADMIN_PROJECT_STATUSES), [
    "USULAN",
    "BERJALAN",
    "SELESAI",
  ]);
  assert.equal(
    lifecycle.PROJECT_STAGE_API_STATUS["Under Construction"],
    "BERJALAN",
  );
});

test("legacy approved projects remain visible as planning without changing API values", () => {
  assert.equal(lifecycle.getProjectStage("DISETUJUI"), "Planning");
  assert.equal(admin.getAdminProjectStatusLabel("DISETUJUI"), "Planning");
  assert.equal(map.mapStatusToUI("BERJALAN"), "Under Construction");
  const projects = [
    {
      id: "legacy",
      name: "Park",
      category: "Park",
      status: map.mapStatusToUI("DISETUJUI"),
    },
  ];
  assert.equal(
    map.filterMapProjects({ projects, searchQuery: "", status: "Planning" })
      .length,
    1,
  );
});

test("map reads project details and feedback without requesting voting endpoints", async () => {
  const requests = [];
  fetchHandler = async (url) => {
    requests.push(url);
    const data =
      url === "/api/projects"
        ? [{ id: "legacy" }]
        : url.startsWith("/api/comments")
          ? [
              {
                id: "feedback",
                text: "Keep this feedback",
                createdAt: "2026-10-21T00:00:00Z",
              },
            ]
          : {
              id: "legacy",
              title: "Park",
              status: "DISETUJUI",
              latitude: -6.9,
              longitude: 107.7,
            };
    return Response.json({ data });
  };
  const projects = await mapApi.fetchMapProjects(null);
  assert.equal(projects[0].status, "Planning");
  assert.equal(projects[0].comments[0].text, "Keep this feedback");
  assert.equal(
    requests.some((url) => url.includes("/votes") || url.includes("/activity")),
    false,
  );
});

test("sentiment uses stored classifications and separates unanalyzed feedback", () => {
  const result = sentiment.summarizeProjectSentiment([
    { sentimentLabel: "POSITIF" },
    { sentimentLabel: "positive" },
    { sentimentLabel: "NEGATIF" },
    {},
    { sentimentLabel: "UNKNOWN" },
  ]);
  assert.equal(result.positive, 2);
  assert.equal(result.negative, 1);
  assert.equal(result.neutral, 0);
  assert.equal(result.pending, 2);
  assert.equal(result.analyzed, 3);
  assert.equal(result.direction, "Mostly positive");
});

test("empty feedback, ties, and neutral classifications have accurate labels", () => {
  assert.equal(
    sentiment.summarizeProjectSentiment([]).direction,
    "No analyzed feedback yet",
  );
  assert.equal(sentiment.summarizeProjectSentiment([{}]).analyzed, 0);
  assert.equal(
    sentiment.summarizeProjectSentiment([
      { sentimentLabel: "POSITIF" },
      { sentimentLabel: "NEGATIF" },
    ]).direction,
    "Mixed sentiment",
  );
  assert.equal(
    sentiment.summarizeProjectSentiment([{ sentimentLabel: "NETRAL" }])
      .direction,
    "Mostly neutral",
  );
});
