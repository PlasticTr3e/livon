import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { paymentService, loadSource } from "./helpers/payment-test-loader.mjs";

const { gatewayPaymentState, createPaymentSchema } = paymentService({});
test("settlement and capture require accepted fraud status before crediting funds", () => {
  const base = { order_id: "LIVON-test", gross_amount: "150000" };
  for (const transaction_status of ["capture", "settlement"]) {
    assert.equal(
      gatewayPaymentState({
        ...base,
        transaction_status,
        fraud_status: "accept",
      }),
      "PAID",
    );
    assert.equal(
      gatewayPaymentState({
        ...base,
        transaction_status,
        fraud_status: "challenge",
      }),
      "PENDING",
    );
    assert.equal(
      gatewayPaymentState({
        ...base,
        transaction_status,
        fraud_status: "deny",
      }),
      "PENDING",
    );
  }
  for (const [state, expected] of [
    ["expire", "EXPIRED"],
    ["cancel", "CANCELLED"],
    ["deny", "FAILED"],
    ["pending", "PENDING"],
  ])
    assert.equal(
      gatewayPaymentState({ ...base, transaction_status: state }),
      expected,
    );
});
test("checkout refuses invalid donation amounts and requires a bill ID for IPL", () => {
  const requestId = "123e4567-e89b-42d3-a456-426614174000";
  for (const amount of [0, -1, 9999, 10000.5, 50000001])
    assert.equal(
      createPaymentSchema.safeParse({ kind: "donation", amount, requestId })
        .success,
      false,
    );
  assert.equal(
    createPaymentSchema.safeParse({
      kind: "donation",
      amount: 25000,
      requestId,
    }).success,
    true,
  );
  assert.equal(
    createPaymentSchema.safeParse({
      kind: "ipl",
      periods: ["2026-11"],
      amount: 1,
      requestId,
    }).success,
    false,
  );
});
test("webhook checks signature before any gateway or database work", async () => {
  const key = "billing-test-only-secret";
  let calls = 0;
  const route = loadSource(
    "src/app/api/finance/payments/webhook/route.ts",
    {
      "@/services/finance/payment-service": {
        refreshPayment: async () => {
          calls++;
        },
        PaymentError: class extends Error {},
      },
    },
    { process: { env: { MIDTRANS_SERVER_KEY: key } } },
  );
  const body = {
    order_id: "LIVON-test",
    status_code: "200",
    gross_amount: "150000.00",
    signature_key: "0".repeat(128),
  };
  const request = () => ({ json: async () => body });
  assert.equal((await route.POST(request())).status, 403);
  assert.equal(calls, 0);
  body.signature_key = createHash("sha512")
    .update(body.order_id + body.status_code + body.gross_amount + key)
    .digest("hex");
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(calls, 1);
});

test("Midtrans status_code errors are handled even when HTTP status is 200", async () => {
  let code = "404";
  const gateway = loadSource(
    "src/services/finance/payment-gateway.ts",
    {},
    {
      process: { env: { MIDTRANS_SERVER_KEY: "billing-test-key" } },
      fetch: async () => Response.json({ status_code: code }),
    },
  );
  assert.equal(await gateway.paymentGateway.status("LIVON-test"), null);
  code = "401";
  await assert.rejects(
    gateway.paymentGateway.status("LIVON-test"),
    (error) => error.status === 401,
  );
});
