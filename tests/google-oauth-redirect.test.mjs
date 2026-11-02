import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadRoute(relativePath, appUrl) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const testModule = { exports: {} };
  const exchanges = [];
  const dependencies = {
    "next/server": {
      NextResponse: {
        redirect: (url) => new Response(null, { status: 307, headers: { Location: url } }),
      },
    },
    "@/lib/prisma": {
      __esModule: true,
      default: { user: { findUnique: async () => null } },
    },
    "@/lib/auth": { signAuthToken: () => "test-token" },
  };
  vm.runInNewContext(compiled, {
    module: testModule,
    exports: testModule.exports,
    require: (name) => {
      if (!(name in dependencies)) throw new Error("Unexpected dependency: " + name);
      return dependencies[name];
    },
    process: { env: {
      NEXT_PUBLIC_APP_URL: appUrl,
      GOOGLE_CLIENT_ID: "test-client",
      GOOGLE_CLIENT_SECRET: "test-secret",
    } },
    URL, URLSearchParams,
    console: { error: () => {} },
    fetch: async (url, options) => {
      if (url === "https://oauth2.googleapis.com/token") {
        exchanges.push(new URLSearchParams(options.body));
        return Response.json({ access_token: "test-access-token" });
      }
      return Response.json({ email: "oauth-test@example.com", name: "OAuth test" });
    },
  });
  return { route: testModule.exports, exchanges };
}

for (const configuredUrl of ["http://localhost:3000", "https://livon-one.vercel.app/"]) {
  const origin = new URL(configuredUrl).origin;

  test("authorization and token exchange share the callback for " + origin, async () => {
    const initial = loadRoute("src/app/api/auth/google/route.ts", configuredUrl);
    const redirect = await initial.route.GET();
    const googleUrl = new URL(redirect.headers.get("Location"));
    const callbackUrl = origin + "/api/auth/google/callback";
    assert.equal(googleUrl.hostname, "accounts.google.com");
    assert.equal(googleUrl.searchParams.get("redirect_uri"), callbackUrl);

    const callback = loadRoute("src/app/api/auth/google/callback/route.ts", configuredUrl);
    const result = await callback.route.GET({
      nextUrl: new URL(callbackUrl + "?code=test-code"),
    });
    assert.equal(callback.exchanges[0].get("redirect_uri"), callbackUrl);
    const registrationUrl = new URL(result.headers.get("Location"));
    assert.equal(registrationUrl.origin, origin);
    assert.equal(registrationUrl.pathname, "/auth/register");
  });

  test("OAuth failures remain on the configured origin " + origin, async () => {
    const callback = loadRoute("src/app/api/auth/google/callback/route.ts", configuredUrl);
    const result = await callback.route.GET({
      nextUrl: new URL(origin + "/api/auth/google/callback"),
    });
    assert.equal(result.headers.get("Location"), origin + "/auth/login?error=OAuthFailed");
    assert.equal(callback.exchanges.length, 0);
  });
}

test("missing app URL falls back to localhost for development", async () => {
  const initial = loadRoute("src/app/api/auth/google/route.ts", undefined);
  const result = await initial.route.GET();
  assert.equal(
    new URL(result.headers.get("Location")).searchParams.get("redirect_uri"),
    "http://localhost:3000/api/auth/google/callback",
  );
});
