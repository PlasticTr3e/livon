import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const mutations = [
  ["posts/route.ts", "POST"],
  ["posts/[id]/route.ts", "DELETE"],
  ["posts/[id]/like/route.ts", "POST"],
  ["posts/[id]/comments/route.ts", "POST"],
  ["comments/[id]/route.ts", "DELETE"],
  ["comments/[id]/like/route.ts", "POST"],
];

function loadRoute(relativePath, user, services = {}) {
  const source = fs.readFileSync(
    new URL("../src/app/api/community/" + relativePath, import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const testModule = { exports: {} };
  const response = (message, options) => ({ message, ...options });
  vm.runInNewContext(compiled, {
    module: testModule,
    exports: testModule.exports,
    console,
    URL,
    require(name) {
      if (name === "@/lib/auth")
        return {
          getAuthUser: async () => {
            await Promise.resolve();
            return user;
          },
        };
      if (name === "@/lib/api-response")
        return {
          ok: response,
          created: response,
          badRequest: (message) => ({ status: 400, message }),
          internalError: (message) => ({ status: 500, message }),
        };
      if (name.endsWith("community-service")) return services;
      if (name.endsWith("community-schema"))
        return { postQuerySchema: { parse: (query) => query } };
      return {};
    },
  });
  return testModule.exports;
}

for (const [route, method] of mutations) {
  test(`${method} ${route} rejects an asynchronously resolved anonymous user`, async () => {
    const result = await loadRoute(route, null)[method](
      {},
      { params: Promise.resolve({ id: "test-id" }) },
    );
    assert.equal(result.status, 400);
    assert.match(result.message, /Unauthorized/);
  });
}

test("post likes forward the resolved user ID to the service", async () => {
  let args;
  const route = loadRoute(
    "posts/[id]/like/route.ts",
    { userId: "resident-1" },
    {
      togglePostLike: async (...input) => {
        args = input;
        return { isLiked: true, likesCount: 1 };
      },
    },
  );
  const result = await route.POST(
    {},
    { params: Promise.resolve({ id: "post-1" }) },
  );
  assert.deepEqual(args, ["post-1", "resident-1"]);
  assert.equal(result.data.isLiked, true);
});

test("feed forwards the resolved user ID for personalized like states", async () => {
  let receivedUser;
  const route = loadRoute(
    "posts/route.ts",
    { userId: "resident-1" },
    {
      getCommunityPosts: async (_, userId) => {
        receivedUser = userId;
        return { posts: [], total: 0, page: 1, totalPages: 0 };
      },
    },
  );
  await route.GET({ url: "http://localhost/api/community/posts" });
  assert.equal(receivedUser, "resident-1");
});
