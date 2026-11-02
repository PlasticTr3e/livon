import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { File } from "node:buffer";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const loadDependency = createRequire(import.meta.url);
const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const source = fs.readFileSync(
  path.join(projectRoot, "src/lib/community/community-api.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const schemaSource = fs.readFileSync(
  path.join(projectRoot, "src/services/community/community-schema.ts"),
  "utf8",
);
const schemaModule = { exports: {} };
const schemaCode = ts.transpileModule(schemaSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
vm.runInThisContext("(function(require,module,exports){" + schemaCode + "\n})")(
  loadDependency,
  schemaModule,
  schemaModule.exports,
);
const { createPostSchema, createCommentSchema } = schemaModule.exports;

const replyId = "373b9963-6d27-46cc-a77e-78180f271676";
const comment = (overrides = {}) => ({
  id: "comment-1",
  postId: "post-1",
  author: { name: "Resident", role: "resident" },
  content: "Komentar",
  timeLabel: "Baru saja",
  createdAt: "2026-10-21T00:00:00Z",
  likesCount: 4,
  isLiked: false,
  replies: [],
  ...overrides,
});
const post = (overrides = {}) => ({
  id: "post-1",
  author: { name: "Resident", role: "resident" },
  content: "Aspirasi",
  images: [],
  timeLabel: "Baru saja",
  createdAt: "2026-10-21T00:00:00Z",
  likesCount: 7,
  isLiked: false,
  comments: [comment({ replies: [comment({ id: replyId, likesCount: 2 })] })],
  ...overrides,
});
const response = (data, status = 200) =>
  Response.json(
    {
      success: status < 400,
      message: status < 400 ? "OK" : "API failed",
      data,
    },
    { status },
  );

function setup(handler, token = "local-test-token") {
  const calls = [];
  const testModule = { exports: {} };
  const context = {
    module: testModule,
    exports: testModule.exports,
    Headers,
    FormData,
    File,
    URLSearchParams,
    URL,
    window: { location: { origin: "http://localhost:3000" } },
    Error,
    localStorage: { getItem: () => token },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return handler(url, options);
    },
  };
  vm.runInNewContext(compiled, context, { filename: "community-api.ts" });
  return { api: testModule.exports, calls };
}

test("feed encodes server search, pagination, bearer token, and nested like counts", async () => {
  const { api, calls } = setup(() =>
    response({
      posts: [post()],
      pagination: { page: 2, limit: 20, total: 30, totalPages: 2 },
    }),
  );
  const result = await api.fetchCommunityPosts("jalan & taman", 2);
  const url = new URL(calls[0].url, "http://localhost");
  assert.equal(url.searchParams.get("search"), "jalan & taman");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(
    calls[0].options.headers.get("Authorization"),
    "Bearer local-test-token",
  );
  assert.equal(result.posts[0].likeCount, 7);
  assert.equal(result.posts[0].comments[0].replies[0].likeCount, 2);
});

test("public feed supports items alias and omits absent bearer token", async () => {
  const { api, calls } = setup(
    () =>
      response({
        items: [post()],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    null,
  );
  assert.equal((await api.fetchCommunityPosts("")).posts.length, 1);
  assert.equal(calls[0].options.headers.has("Authorization"), false);
});

test("detail fetch supports a post outside the first feed page and forwards abort signal", async () => {
  const controller = new AbortController();
  const { api, calls } = setup(() => response(post({ id: "other-post" })));
  assert.equal(
    (await api.fetchCommunityPost("other-post", controller.signal)).id,
    "other-post",
  );
  assert.equal(calls[0].url, "/api/community/posts/other-post");
  assert.equal(calls[0].options.signal, controller.signal);
});

test("post creation sends a payload accepted by the existing backend schema", async () => {
  const { api, calls } = setup(() => response(post(), 201));
  await api.publishCommunityPost([
    { id: "draft", text: " Aspirasi baru ", image: null },
  ]);
  const body = JSON.parse(calls[0].options.body);
  assert.equal(createPostSchema.safeParse(body).success, true);
  assert.equal(body.threadItems[0].text, "Aspirasi baru");
  assert.equal(calls[0].options.method, "POST");
});

test("uploads real files as multipart before publishing remote URLs, including image-only items", async () => {
  const { api, calls } = setup((url) =>
    response(
      url === "/api/upload"
        ? { url: "https://storage.test/photo.png" }
        : post(),
    ),
  );
  await api.publishCommunityPost([
    { id: "text", text: "Laporan", image: null },
    {
      id: "image",
      text: "",
      image: "blob:preview",
      imageFile: new File(["image"], "photo.png", { type: "image/png" }),
    },
  ]);
  assert.equal(calls[0].url, "/api/upload");
  assert.equal(calls[0].options.body.get("file").name, "photo.png");
  assert.equal(calls[0].options.headers.has("Content-Type"), false);
  assert.equal(calls[1].url, "/api/community/posts");
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.images[0], "https://storage.test/photo.png");
  assert.equal(JSON.stringify(body).includes("blob:"), false);
  assert.equal(createPostSchema.safeParse(body).success, true);
});

test("failed uploads do not publish a post or alter the original draft", async () => {
  const { api, calls } = setup(() => response(null, 500));
  const draft = [
    {
      id: "draft",
      text: "Tetap ada",
      image: "blob:preview",
      imageFile: new File(["x"], "photo.png"),
    },
  ];
  await assert.rejects(() => api.publishCommunityPost(draft), /API failed/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/upload");
  assert.equal(draft[0].text, "Tetap ada");
  assert.equal(draft[0].image, "blob:preview");
});

test("blob-only previews cannot accidentally be persisted as image URLs", async () => {
  const { api, calls } = setup(() => response(post()));
  await assert.rejects(
    () =>
      api.publishCommunityPost([
        { id: "draft", text: "Laporan", image: "blob:expired" },
      ]),
    /Select the image again/,
  );
  assert.equal(calls.length, 0);
});

test("comments and replies use content and the parentId from the existing schema", async () => {
  const { api, calls } = setup(() => response(comment(), 201));
  await api.sendCommunityComment("post-1", "Komentar");
  await api.sendCommunityComment("post-1", "Balasan", replyId);
  assert.equal(calls[0].url, "/api/community/posts/post-1/comments");
  assert.equal(
    createCommentSchema.safeParse(JSON.parse(calls[0].options.body)).success,
    true,
  );
  const replyBody = JSON.parse(calls[1].options.body);
  assert.equal(replyBody.parentId, replyId);
  assert.equal(createCommentSchema.safeParse(replyBody).success, true);
});

test("post and comment likes use their respective toggle endpoints and server counts", async () => {
  const { api, calls } = setup(() =>
    response({ isLiked: true, likesCount: 12, likeCount: 12 }),
  );
  assert.equal((await api.likeCommunityPost("post-1")).likesCount, 12);
  await api.likeCommunityComment(replyId);
  assert.equal(calls[0].url, "/api/community/posts/post-1/like");
  assert.equal(calls[1].url, "/api/community/comments/" + replyId + "/like");
  assert.equal(
    calls.every((call) => call.options.method === "POST"),
    true,
  );
});

test("post and reply deletion accept success responses without data", async () => {
  const { api, calls } = setup(() =>
    Response.json({ success: true, message: "Deleted" }),
  );
  await api.deleteCommunityPost("post-1");
  await api.deleteCommunityComment(replyId);
  assert.equal(calls[0].url, "/api/community/posts/post-1");
  assert.equal(calls[1].url, "/api/community/comments/" + replyId);
  assert.equal(
    calls.every((call) => call.options.method === "DELETE"),
    true,
  );
});

test("unauthenticated mutations fail locally before making any request", async () => {
  const { api, calls } = setup(() => response(null), null);
  await assert.rejects(() => api.likeCommunityPost("post-1"), /Please sign in/);
  assert.equal(calls.length, 0);
});

test("API errors retain their status and message for user feedback", async () => {
  const { api } = setup(() =>
    Response.json(
      { success: false, message: "Post not found" },
      { status: 404 },
    ),
  );
  await assert.rejects(
    () => api.fetchCommunityPost("missing"),
    (error) => error.status === 404 && error.message === "Post not found",
  );
});

test("network failures and invalid JSON are surfaced instead of successful empty data", async () => {
  const offline = setup(() => {
    throw new Error("offline");
  });
  await assert.rejects(
    () => offline.api.fetchCommunityPosts(""),
    /Unable to connect/,
  );
  const invalid = setup(
    () => new Response("<html>Error</html>", { status: 500 }),
  );
  await assert.rejects(
    () => invalid.api.fetchCommunityPosts(""),
    /Request failed/,
  );
});

test("invalid or oversized drafts are rejected before uploads", async () => {
  const { api, calls } = setup(() => response(post()));
  await assert.rejects(
    () => api.publishCommunityPost([{ id: "draft", text: " ", image: null }]),
    /cannot be empty/,
  );
  await assert.rejects(
    () =>
      api.publishCommunityPost([
        { id: "draft", text: "x".repeat(5001), image: null },
      ]),
    /5,000/,
  );
  assert.equal(calls.length, 0);
});

for (const uploadedUrl of ["/media/uploads/photo.png", "javascript:alert(1)", ""]) {
  test(`upload URL contract: ${uploadedUrl || "empty"}`, async () => {
    const { api, calls } = setup((url) => response(url === "/api/upload" ? { url: uploadedUrl } : post()));
    const draft = [{ id: "draft", text: "Laporan", image: "blob:preview", imageFile: new File(["x"], "photo.png") }];
    if (uploadedUrl.startsWith("/media/")) {
      await api.publishCommunityPost(draft);
      const body = JSON.parse(calls[1].options.body);
      assert.equal(body.images[0], "http://localhost:3000/media/uploads/photo.png");
      assert.equal(createPostSchema.safeParse(body).success, true);
    } else {
      await assert.rejects(() => api.publishCommunityPost(draft), /valid URL/);
      assert.equal(calls.length, 1);
    }
  });
}

 test("same-origin uploaded media renders as a local next/image source across feed, detail, and creation", async () => {
  const media = "http://localhost:3000/media/uploads/photo.jpg?version=1";
  const { api } = setup((url) => response(url.includes("?") ? { posts: [post({ images: [media] })], pagination: {} } : post({ images: [media] })));
  const feed = await api.fetchCommunityPosts("");
  const detail = await api.fetchCommunityPost("post-1");
  const created = await api.publishCommunityPost([{ id: "draft", text: "Laporan", image: null }]);
  const { getImageProps } = loadDependency("next/image");
  for (const item of [feed.posts[0], detail, created]) {
    assert.equal(item.images[0], "/media/uploads/photo.jpg?version=1");
    assert.doesNotThrow(() => getImageProps({ src: item.images[0], alt: "Laporan", width: 640, height: 400 }));
  }
});

test("media mapping preserves relative sources and external image origins", () => {
  const { api } = setup(() => response(null));
  const images = ["/media/uploads/photo.jpg", "https://images.unsplash.com/photo-1", "http://localhost:3001/media/photo.jpg"];
  assert.deepEqual(Array.from(api.mapCommunityPost(post({ images })).images), images);
});

test("Community translates API time labels without changing user content", () => {
  const { api } = setup(() => response(null));
  const original = post({ content: "Aspirasi warga", timeLabel: "2 jam lalu", comments: [comment({ content: "Komentar asli", timeLabel: "1 hari lalu", replies: [comment({ timeLabel: "Baru saja" })] })] });
  const mapped = api.mapCommunityPost(original);
  assert.equal(mapped.timeLabel, "2 hours ago");
  assert.equal(mapped.comments[0].timeLabel, "1 day ago");
  assert.equal(mapped.comments[0].replies[0].timeLabel, "Just now");
  assert.equal(mapped.content, original.content);
  assert.equal(mapped.comments[0].content, original.comments[0].content);
  for (const [input, expected] of [["1 menit lalu", "1 minute ago"], ["3 minggu lalu", "3 weeks ago"], ["1 bulan lalu", "1 month ago"], ["2 tahun lalu", "2 years ago"], ["Yesterday", "Yesterday"]]) {
    assert.equal(api.mapCommunityPost(post({ timeLabel: input })).timeLabel, expected);
  }
});
