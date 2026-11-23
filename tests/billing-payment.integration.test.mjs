import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { paymentService, loadSource } from "./helpers/payment-test-loader.mjs";

test(
  "billing database integration: ownership, durable orders, settlement and accounting",
  { skip: process.env.LIVON_RUN_DB_TESTS !== "1" },
  async (t) => {
    const require = createRequire(import.meta.url);
    const { PrismaClient, Prisma } = require("../tmp/billing-test-client");
    const { PrismaPg } = require("@prisma/adapter-pg");
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    const service = paymentService(prisma);
    const enums = loadSource("src/generated/prisma/enums.ts");
    const finance = loadSource("src/services/finance/finance-service.ts", {
      "@/lib/prisma": { __esModule: true, default: prisma },
      "@/generated/prisma/enums": enums,
      "@/generated/prisma/client": { Prisma },
    });
    const users = [randomUUID(), randomUUID(), randomUUID()];
    const suffix = randomUUID();
    let gatewayCalls = 0;
    const gateway = {
      create: async () => {
        gatewayCalls++;
        return { token: "test-snap-token" };
      },
      status: async () => null,
    };
    const billId = randomUUID(),
      retryBillId = randomUUID(),
      manualBillId = randomUUID();
    let order;
    try {
      await prisma.user.createMany({
        data: users.map((id, index) => ({
          id,
          email: `billing-test-${index}-${suffix}@example.test`,
          role: index === 2 ? "AGENCY" : "WARGA",
          emailVerified: new Date(),
        })),
      });
      await prisma.residentBill.createMany({
        data: [
          {
            id: billId,
            userId: users[0],
            title: "UJI OTOMATIS IPL",
            month: 1,
            year: 2026,
            amount: 175000,
          },
          {
            id: retryBillId,
            userId: users[0],
            title: "UJI OTOMATIS RETRY",
            month: 2,
            year: 2026,
            amount: 150000,
          },
          {
            id: manualBillId,
            userId: users[1],
            title: "UJI OTOMATIS VERIFIKASI",
            month: 1,
            year: 2026,
            amount: 125000,
            status: "MENUNGGU_VERIFIKASI",
          },
        ],
      });
      await t.test(
        "another resident cannot pay or inspect someone else's bill/order",
        async () => {
          await assert.rejects(
            service.createPayment(
              users[1],
              { kind: "ipl", billId, requestId: randomUUID() },
              gateway,
            ),
            /Tagihan tidak ditemukan/,
          );
          assert.equal(gatewayCalls, 0);
        },
      );
      await t.test(
        "IPL amount is owned by the database and repeated requests reuse the active order",
        async () => {
          const input = {
            kind: "ipl",
            billId,
            requestId: randomUUID(),
            amount: 1,
          };
          order = await service.createPayment(users[0], input, gateway);
          assert.equal(order.amount, 175000);
          assert.equal(order.status, "PENDING");
          assert.equal(
            (await service.createPayment(users[0], input, gateway)).id,
            order.id,
          );
          assert.equal(
            (
              await service.createPayment(
                users[0],
                { ...input, requestId: randomUUID() },
                gateway,
              )
            ).id,
            order.id,
          );
          assert.equal(gatewayCalls, 1);
          await assert.rejects(
            service.refreshPayment(order.id, users[1], gateway),
            /Transaksi tidak ditemukan/,
          );
          assert.equal(
            (await service.refreshPayment(order.id, users[0], gateway)).id,
            order.id,
          );
        },
      );
      await t.test(
        "parallel settlement and replay credit the ledger exactly once",
        async () => {
          const before = await prisma.financeSummary.findUnique({
            where: { fundType: "IPL" },
          });
          const status = {
            order_id: order.id,
            gross_amount: "175000.00",
            transaction_status: "settlement",
            fraud_status: "accept",
            payment_type: "bank_transfer",
          };
          await Promise.all(
            Array.from({ length: 5 }, () =>
              service.reconcilePayment(order.id, status),
            ),
          );
          assert.equal(
            await prisma.financialTransaction.count({
              where: { paymentOrderId: order.id },
            }),
            1,
          );
          assert.equal(
            (await prisma.residentBill.findUnique({ where: { id: billId } }))
              .status,
            "LUNAS",
          );
          assert.equal(
            await prisma.notification.count({
              where: {
                userId: users[0],
                type: "payment_success",
                referenceId: order.id,
              },
            }),
            1,
          );
          const after = await prisma.financeSummary.findUnique({
            where: { fundType: "IPL" },
          });
          assert.equal(
            Number(after.balance) - Number(before?.balance ?? 0),
            175000,
          );
          assert.equal(
            (
              await service.refreshPayment(order.id, users[0], {
                ...gateway,
                status: async () => {
                  throw new Error("Paid receipt should not require gateway");
                },
              })
            ).status,
            "PAID",
          );
        },
      );
      await t.test(
        "wrong gross amount and challenged capture cannot settle an anonymous donation",
        async () => {
          const donation = await service.createPayment(
            users[1],
            {
              kind: "donation",
              amount: 25000,
              anonymous: true,
              message: "UJI OTOMATIS",
              requestId: randomUUID(),
            },
            gateway,
          );
          const status = {
            order_id: donation.id,
            gross_amount: "1",
            transaction_status: "capture",
            fraud_status: "accept",
          };
          await assert.rejects(
            service.reconcilePayment(donation.id, status),
            /Rincian transaksi tidak sesuai/,
          );
          assert.equal(
            (
              await service.reconcilePayment(donation.id, {
                ...status,
                gross_amount: "25000",
                fraud_status: "challenge",
              })
            ).status,
            "PENDING",
          );
          assert.equal(
            await prisma.financialTransaction.count({
              where: { paymentOrderId: donation.id },
            }),
            0,
          );
          await service.reconcilePayment(donation.id, {
            ...status,
            gross_amount: "25000",
            transaction_status: "settlement",
          });
          assert.equal(
            (
              await prisma.financialTransaction.findUnique({
                where: { paymentOrderId: donation.id },
              })
            ).recordedById,
            null,
          );
        },
      );
      await t.test(
        "rejected gateway credentials create no successful payment and allow a fresh attempt",
        async () => {
          await assert.rejects(
            service.createPayment(
              users[0],
              { kind: "ipl", billId: retryBillId, requestId: randomUUID() },
              {
                ...gateway,
                create: async () => {
                  throw new service.GatewayError(401);
                },
              },
            ),
            /belum dapat disiapkan/,
          );
          await assert.rejects(
            service.createPayment(
              users[0],
              { kind: "ipl", billId: retryBillId, requestId: randomUUID() },
              {
                ...gateway,
                create: async () => {
                  throw new Error("Simulated network timeout");
                },
              },
            ),
            /belum dapat disiapkan/,
          );
          const retry = await service.createPayment(
            users[0],
            { kind: "ipl", billId: retryBillId, requestId: randomUUID() },
            gateway,
          );
          await assert.rejects(
            finance.payResidentBill(users[0], retryBillId, {
              paymentProofUrl: "https://example.test/test-receipt",
            }),
            /pembayaran online/,
          );
          const unavailable = {
            ...gateway,
            status: async () => {
              throw new service.GatewayError(503);
            },
          };
          const cached = await service.refreshPayment(
            retry.id,
            users[0],
            unavailable,
          );
          assert.equal(cached.status, "PENDING");
          assert.ok(cached.warning);
          await assert.rejects(
            service.refreshPayment(retry.id, users[0], unavailable, true),
          );
          await prisma.paymentOrder.update({
            where: { id: retry.id },
            data: { expiresAt: new Date(Date.now() - 1000) },
          });
          assert.equal(
            (await service.refreshPayment(retry.id, users[0], gateway)).status,
            "EXPIRED",
          );
        },
      );
      await t.test(
        "manual verification also resists double credit",
        async () => {
          const results = await Promise.allSettled([
            finance.verifyResidentBill(users[2], manualBillId),
            finance.verifyResidentBill(users[2], manualBillId),
          ]);
          assert.equal(
            results.filter((r) => r.status === "fulfilled").length,
            1,
          );
          assert.equal(
            await prisma.financialTransaction.count({
              where: { residentBillId: manualBillId },
            }),
            1,
          );
        },
      );
      await t.test(
        "expense updates the correct fund and residents only receive their own bills",
        async () => {
          const before = await prisma.financeSummary.findUnique({
            where: { fundType: "IPL" },
          });
          await finance.createExpenseReport(users[2], {
            title: "UJI OTOMATIS PENGELUARAN",
            amount: 12000,
            fundType: "IPL",
            category: "Pengujian",
          });
          const after = await prisma.financeSummary.findUnique({
            where: { fundType: "IPL" },
          });
          assert.equal(Number(before.balance) - Number(after.balance), 12000);
          const own = await finance.getResidentBills(
            { userId: users[0], role: "WARGA" },
            { page: 1, limit: 100 },
          );
          assert.equal(own.bills.length, 2);
          assert.ok(own.bills.every((b) => b.userId === users[0]));
        },
      );
      await t.test(
        "late duplicate funds are recorded once and flagged for review",
        async () => {
          const late = await prisma.paymentOrder.create({
            data: {
              id: "LIVON-" + randomUUID(),
              requestKey: randomUUID(),
              userId: users[0],
              billId,
              title: "UJI PEMBAYARAN GANDA",
              payerName: "UJI",
              fundType: "IPL",
              amount: 175000,
              status: "PENDING",
              expiresAt: new Date(Date.now() + 3600000),
            },
          });
          const status = {
            order_id: late.id,
            gross_amount: "175000",
            transaction_status: "settlement",
          };
          assert.equal(
            (await service.reconcilePayment(late.id, status)).status,
            "REVIEW",
          );
          assert.equal(
            (await service.reconcilePayment(late.id, status)).status,
            "REVIEW",
          );
          assert.equal(
            await prisma.financialTransaction.count({
              where: { paymentOrderId: late.id },
            }),
            1,
          );
          assert.equal(
            (
              await prisma.financialTransaction.findUnique({
                where: { paymentOrderId: late.id },
              })
            ).residentBillId,
            null,
          );
          assert.equal(
            await prisma.financialTransaction.count({
              where: { residentBillId: billId },
            }),
            1,
          );
        },
      );
      await t.test(
        "bill generation is repeatable without modifying existing bills",
        async () => {
          const rollback = new Error("ROLLBACK_BILL_GENERATION_TEST");
          await assert.rejects(
            prisma.$transaction(async (tx) => {
              await tx.citizenProfile.create({
                data: {
                  userId: users[0],
                  fullName: "UJI OTOMATIS",
                  phone: "TEST",
                  kkNumber: "TEST-KK-" + suffix,
                  nik: "TEST-NIK-" + suffix,
                  isVerified: true,
                },
              });
              const transactionalFinance = loadSource(
                "src/services/finance/finance-service.ts",
                {
                  "@/lib/prisma": { __esModule: true, default: tx },
                  "@/generated/prisma/enums": enums,
                  "@/generated/prisma/client": { Prisma },
                },
              );
              const first = await transactionalFinance.generateMonthlyBills(
                users[2],
                { month: 12, year: 2098, amount: 175000 },
              );
              const repeated = await transactionalFinance.generateMonthlyBills(
                users[2],
                { month: 12, year: 2098, amount: 999999 },
              );
              assert.ok(first.generatedCount >= 1);
              assert.equal(repeated.generatedCount, 0);
              assert.equal(
                Number(
                  (
                    await tx.residentBill.findUnique({
                      where: {
                        userId_month_year: {
                          userId: users[0],
                          month: 12,
                          year: 2098,
                        },
                      },
                    })
                  ).amount,
                ),
                175000,
              );
              throw rollback;
            }),
            /ROLLBACK_BILL_GENERATION_TEST/,
          );
        },
      );
    } finally {
      await prisma.$transaction(async (tx) => {
        const orders = await tx.paymentOrder.findMany({
          where: { userId: { in: users } },
          select: { id: true },
        });
        const ids = orders.map((item) => item.id);
        const filter = {
          OR: [
            { paymentOrderId: { in: ids } },
            { recordedById: { in: users } },
          ],
        };
        const totals = await tx.financialTransaction.groupBy({
          by: ["fundType", "type"],
          where: filter,
          _sum: { amount: true },
        });
        for (const total of totals) {
          const amount = total._sum.amount ?? 0;
          await tx.financeSummary.updateMany({
            where: { fundType: total.fundType },
            data:
              total.type === "PEMASUKAN"
                ? {
                    balance: { decrement: amount },
                    totalIncome: { decrement: amount },
                  }
                : {
                    balance: { increment: amount },
                    totalExpense: { decrement: amount },
                  },
          });
        }
        await tx.financialTransaction.deleteMany({ where: filter });
        await tx.paymentOrder.deleteMany({ where: { userId: { in: users } } });
        await tx.residentBill.deleteMany({ where: { userId: { in: users } } });
        await tx.user.deleteMany({ where: { id: { in: users } } });
      });
      await prisma.$disconnect();
    }
  },
);
