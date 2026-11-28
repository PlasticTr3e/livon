import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
export function loadSource(relativePath, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(
    fs.readFileSync(new URL("../../" + relativePath, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, {
    module: testModule,
    exports: testModule.exports,
    console,
    Date,
    Buffer,
    URL,
    Response,
    process,
    fetch,
    AbortSignal,
    require(name) {
      const i18nSources = {
        "@/lib/i18n/display": "src/lib/i18n/display.ts",
        "./translate": "src/lib/i18n/translate.ts",
        "./messages": "src/lib/i18n/messages.ts",
        "./extra-messages": "src/lib/i18n/extra-messages.ts",
      };
      if (name in i18nSources) return loadSource(i18nSources[name]);
      if (name === "@/lib/finance/bill-items")
        return loadSource("src/lib/finance/bill-items.ts");
      if (name === "./billing-notifications")
        return loadSource("src/services/finance/billing-notifications.ts");
      if (name in dependencies) return dependencies[name];
      if (name === "@/lib/permissions")
        return loadSource("src/lib/permissions.ts", {
          "@/generated/prisma/enums": loadSource("src/generated/prisma/enums.ts"),
        });
      return require(name);
    },
    ...globals,
  });
  return testModule.exports;
}
export function paymentService(prisma) {
  const gateway = loadSource("src/services/finance/payment-gateway.ts");
  const service = loadSource("src/services/finance/payment-service.ts", {
    "@/lib/prisma": { __esModule: true, default: prisma },
    "@/lib/payment/billing": loadSource("src/lib/payment/billing.ts"),
    "./payment-gateway": gateway,
  });
  return { ...service, GatewayError: gateway.GatewayError };
}
