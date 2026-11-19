import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const SentimentLabel = {
  POSITIF: "POSITIF",
  NEGATIF: "NEGATIF",
  NETRAL: "NETRAL",
};

function loadTsModule(relativePath, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const testModule = { exports: {} };
  vm.runInNewContext(
    compiled,
    {
      module: testModule,
      exports: testModule.exports,
      console,
      AbortSignal,
      URL,
      process: { env: {} },
      ...globals,
      require(name) {
        if (name in mocks) return mocks[name];
        throw new Error(`Unexpected require: ${name}`);
      },
    },
    { filename: relativePath },
  );
  return testModule.exports;
}

const { analyzeSentimentLocal } = loadTsModule("src/services/sentiment.ts", {
  "@/generated/prisma/enums": { SentimentLabel },
});

const { computeProjectSentimentAnalytics } = loadTsModule(
  "src/lib/project-sentiment.ts",
);

test("local fallback handles multi-word phrases and negations properly", () => {
  const thanks = analyzeSentimentLocal("terima kasih sudah perbaiki jalan!");
  assert.equal(thanks.label, SentimentLabel.POSITIF);
  assert.ok(thanks.score > 0.5 && thanks.score <= 1);

  const negatedPraise = analyzeSentimentLocal(
    "proyek ini tidak bagus dan buang anggaran",
  );
  assert.equal(negatedPraise.label, SentimentLabel.NEGATIF);
  assert.ok(negatedPraise.score > 0.5 && negatedPraise.score <= 1);

  const negatedComplaint = analyzeSentimentLocal(
    "pembangunan ini tidak mengganggu warga justru sangat membantu",
  );
  assert.equal(negatedComplaint.label, SentimentLabel.POSITIF);

  const falseSubstring = analyzeSentimentLocal(
    "sebab aja jalannya sudah bagus banget",
  );
  assert.equal(falseSubstring.label, SentimentLabel.POSITIF);

  const neutralIdiom = analyzeSentimentLocal("b aja");
  assert.equal(neutralIdiom.label, SentimentLabel.NETRAL);
});

test("computeProjectSentimentAnalytics weights averageScore with polarity sign", () => {
  const positiveHeavy = computeProjectSentimentAnalytics([
    { sentimentLabel: "POSITIF", sentimentScore: 0.9 },
    { sentimentLabel: "POSITIF", sentimentScore: 0.8 },
    { sentimentLabel: "NETRAL", sentimentScore: 0.7 },
  ]);
  assert.equal(positiveHeavy.totalAnalyzed, 3);
  assert.deepEqual(
    { ...positiveHeavy.distribution },
    {
      positive: 2,
      negative: 0,
      neutral: 1,
    },
  );
  assert.equal(positiveHeavy.averageScore, 0.57);

  const negativeHeavy = computeProjectSentimentAnalytics([
    { sentimentLabel: "NEGATIF", sentimentScore: 0.95 },
    { sentimentLabel: "NEGATIF", sentimentScore: 0.85 },
  ]);
  assert.equal(negativeHeavy.averageScore, -0.9);
  assert.ok(positiveHeavy.averageScore > negativeHeavy.averageScore);

  const balanced = computeProjectSentimentAnalytics([
    { sentimentLabel: "POSITIF", sentimentScore: 0.9 },
    { sentimentLabel: "NEGATIF", sentimentScore: 0.9 },
  ]);
  assert.equal(balanced.averageScore, 0);
});

test("analyzeSentiment falls back cleanly when AI service times out or errors", async () => {
  const withMockFetch = loadTsModule(
    "src/services/sentiment.ts",
    {
      "@/generated/prisma/enums": { SentimentLabel },
    },
    {
      process: {
        env: {
          AI_SERVICE_URL: "http://ai-service:7860/",
          AI_SERVICE_API_KEY: "secret",
        },
      },
      fetch: async (url, init) => {
        assert.equal(url, "http://ai-service:7860/api/predict");
        assert.ok(init.signal);
        return { ok: false, status: 503, text: async () => "unavailable" };
      },
    },
  );

  const result = await withMockFetch.analyzeSentiment(
    "jalan sudah mulus dan bagus",
  );
  assert.equal(result.label, SentimentLabel.POSITIF);
  assert.ok(result.score >= 0.5 && result.score <= 1);
});
