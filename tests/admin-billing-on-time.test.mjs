import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/payment-test-loader.mjs";

function bill(status, dueDate, paidAt = null) {
  return {
    id: "bill",
    userId: "resident",
    amount: 100000,
    status,
    dueDate: dueDate && new Date(dueDate),
    paidAt: paidAt && new Date(paidAt),
    user: { email: "case@example.test", citizenProfile: null },
  };
}
async function overview(bills, residents = []) {
  const service = loadSource("src/services/finance/admin-billing.ts", {
    "@/lib/prisma": {
      __esModule: true,
      default: {
        residentBill: { findMany: async () => bills },
        citizenProfile: { findMany: async () => residents },
      },
    },
    "@/generated/prisma/client": { Prisma: {} },
    "./donation-feed": {},
    "./payment-service": {},
  });
  return (
    await service.getIplOverview({
      period: "2026-11",
      page: 1,
      category: "ALL",
    })
  ).metrics;
}
async function rate(bills) {
  return (await overview(bills)).onTimeRate;
}
const onTime = () => bill("LUNAS", "2020-01-10", "2020-01-09");
test("unpaid overdue bill lowers punctuality; future unpaid bill does not", async () => {
  assert.equal(
    await rate([
      onTime(),
      bill("BELUM_BAYAR", "2020-01-10"),
      bill("BELUM_BAYAR", "2099-01-10"),
    ]),
    50,
  );
});
test("late payments and overdue verification remain in the denominator", async () => {
  assert.equal(
    await rate([
      onTime(),
      bill("LUNAS", "2020-01-10", "2020-01-12"),
      bill("MENUNGGU_VERIFIKASI", "2020-01-10"),
    ]),
    33,
  );
});
test("only future unpaid bills or empty period return zero", async () => {
  assert.equal(await rate([]), 0);
  assert.equal(await rate([bill("BELUM_BAYAR", "2099-01-10")]), 0);
  assert.equal(await rate([onTime()]), 100);
});

test("house coverage counts verified addresses once while total amount includes every period bill", async () => {
  const residents = [
    { userId: "resident", blockHouse: "A", houseNumber: "22" },
    { userId: "same-house", blockHouse: " a ", houseNumber: "22 " },
    { userId: "unbilled", blockHouse: "A", houseNumber: "23" },
    { userId: "no-address", blockHouse: null, houseNumber: null },
  ];
  const metrics = await overview(
    [
      onTime(),
      { ...onTime(), userId: "same-house" },
      { ...onTime(), userId: "no-address" },
      { ...onTime(), userId: "inactive-resident" },
    ],
    residents,
  );
  assert.equal(metrics.houseCount, 2);
  assert.equal(metrics.billedHouseCount, 1);
  assert.equal(metrics.billedAmount, 400000);
});
