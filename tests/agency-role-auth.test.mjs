import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadModule(relativePath, dependencies = {}) {
  const source = fs.readFileSync(new URL("../" + relativePath, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: testModule,
    exports: testModule.exports,
    Response,
    console,
    require(name) {
      if (!(name in dependencies)) throw new Error("Unexpected dependency: " + name);
      return dependencies[name];
    },
  });
  return testModule.exports;
}

const enums = loadModule("src/generated/prisma/enums.ts");
const permissions = loadModule("src/lib/permissions.ts", {
  "@/generated/prisma/enums": enums,
});

test("both management roles can access resident data and only DEVELOPER can manage projects", () => {
  for (const role of ["AGENCY", "DEVELOPER"]) {
    assert.equal(permissions.canAccessSensitiveResidentData(role), true);
    assert.equal(permissions.canManageProjects(role), role === "DEVELOPER");
  }
  for (const role of ["WARGA", "ADMIN", null, undefined]) {
    assert.equal(permissions.canAccessSensitiveResidentData(role), false);
    assert.equal(permissions.canManageProjects(role), false);
  }
});

for (const role of ["AGENCY", "WARGA", "DEVELOPER", "ADMIN", null]) {
  test("comment moderation authorizes " + (role ?? "anonymous") + " correctly", async () => {
    let databaseCalls = 0;
    const route = loadModule("src/app/api/comments/admin/route.ts", {
      "@/lib/permissions": permissions,
      "@/lib/auth": {
        getAuthUser: async () => (role ? { userId: "demo-user", role } : null),
      },
      "@/lib/prisma": {
        __esModule: true,
        default: {
          comment: {
            findMany: async () => {
              databaseCalls += 1;
              return [];
            },
          },
        },
      },
      "@/lib/api-response": {
        ok: (message, options) => Response.json({ message, ...options }),
        internalError: (message) => Response.json({ message }, { status: 500 }),
      },
    });
    const response = await route.GET({});
    const allowed = role === "AGENCY" || role === "DEVELOPER";
    assert.equal(response.status, allowed ? 200 : 401);
    assert.equal(databaseCalls, allowed ? 1 : 0);
  });
}

test("resident detail and mutations reject residents before querying data", async () => {
  const route = loadModule("src/app/api/agency/citizens/[id]/route.ts", {
    "next/server": { NextResponse: Response },
    "@/generated/prisma/enums": enums,
    "@/lib/permissions": permissions,
    "@/lib/auth": { getAuthUser: async () => ({ userId: "resident", role: "WARGA" }) },
    "@/lib/prisma": { __esModule: true, default: {} },
    "@/lib/cache": {},
    "@/lib/api-response": {},
  });
  for (const method of ["GET", "PUT", "DELETE"]) {
    const response = await route[method]({}, { params: Promise.resolve({ id: "resident" }) });
    assert.equal(response.status, 403);
  }
});
