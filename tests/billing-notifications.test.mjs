import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/payment-test-loader.mjs";
const { syncBillingNotifications, notifyPaidPayment } = loadSource(
  "src/services/finance/billing-notifications.ts",
);

function fixture() {
  const rows = new Map();
  const state = { bills: [], orders: [] };
  const matches = (row, where) =>
    Object.entries(where).every(([key, value]) =>
      value && typeof value === "object"
        ? value.in.includes(row[key])
        : row[key] === value,
    );
  const db = {
    notification: {
      createMany: async ({ data }) => {
        for (const row of data)
          if (!rows.has(row.id)) rows.set(row.id, { isRead: false, ...row });
      },
      updateMany: async ({ where, data }) => {
        for (const row of rows.values())
          if (matches(row, where)) Object.assign(row, data);
      },
    },
    residentBill: {
      findMany: async ({ where }) =>
        state.bills.filter((b) => b.userId === where.userId),
    },
    paymentOrder: {
      findMany: async ({ where }) =>
        state.orders.filter(
          (o) => o.userId === where.userId && o.status === where.status,
        ),
    },
  };
  const bill = {
    id: "bill",
    userId: "u",
    title: "IPL",
    amount: 250000,
    status: "BELUM_BAYAR",
    dueDate: new Date("2026-11-30"),
    paymentOrders: [],
  };
  state.bills.push(bill);
  return { db, state, bill, rows };
}
test("unpaid reminder transitions to overdue once, without re-alerting read messages", async () => {
  const f = fixture();
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  assert.equal([...f.rows.values()][0].type, "bill_unpaid");
  await syncBillingNotifications(f.db, "u", new Date("2026-12-02"));
  assert.equal(f.rows.size, 2);
  assert.equal(
    [...f.rows.values()].find((n) => n.type === "bill_unpaid").isRead,
    true,
  );
  const overdue = [...f.rows.values()].find((n) => n.type === "bill_overdue");
  overdue.isRead = true;
  await syncBillingNotifications(f.db, "u", new Date("2026-12-03"));
  assert.equal(f.rows.size, 2);
  assert.equal(overdue.isRead, true);
});
test("confirmed IPL closes reminders and emits one success despite replay", async () => {
  const f = fixture();
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  const order = {
    id: "order",
    billId: "bill",
    userId: "u",
    fundType: "IPL",
    amount: 250000,
  };
  await notifyPaidPayment(f.db, order);
  await notifyPaidPayment(f.db, order);
  assert.equal(
    [...f.rows.values()].filter((n) => n.type === "payment_success").length,
    1,
  );
  assert.equal(
    [...f.rows.values()].find((n) => n.type === "bill_unpaid").isRead,
    true,
  );
});
test("existing paid donation is backfilled; pending donation and other user's bills do not notify", async () => {
  const f = fixture();
  f.state.bills = [{ ...f.bill, userId: "other" }];
  f.state.orders = [
    {
      id: "donation",
      userId: "u",
      billId: null,
      fundType: "DONASI",
      amount: 535500,
      status: "PAID",
    },
    { id: "pending", userId: "u", status: "PENDING" },
  ];
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  assert.equal(f.rows.size, 1);
  assert.equal([...f.rows.values()][0].type, "donation_success");
});
test("manual verification closes stale unpaid reminders", async () => {
  const f = fixture();
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  f.bill.status = "MENUNGGU_VERIFIKASI";
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  assert.equal([...f.rows.values()][0].isRead, true);
  assert.equal(f.rows.size, 1);
  f.bill.status = "LUNAS";
  await syncBillingNotifications(f.db, "u", new Date("2026-11-19"));
  assert.equal(
    [...f.rows.values()].filter((n) => n.type === "payment_success").length,
    1,
  );
});
