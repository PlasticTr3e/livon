BEGIN;

DO $$ BEGIN CREATE TYPE "FundType" AS ENUM ('IPL', 'DONASI'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TransactionType" AS ENUM ('PEMASUKAN', 'PENGELUARAN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BillStatus" AS ENUM ('BELUM_BAYAR', 'LUNAS', 'MENUNGGU_VERIFIKASI'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "finance_summaries" (
  "id" TEXT PRIMARY KEY,
  "fundType" "FundType" NOT NULL UNIQUE,
  "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "totalIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "totalExpense" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "resident_bills" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL CHECK ("amount" > 0),
  "status" "BillStatus" NOT NULL DEFAULT 'BELUM_BAYAR',
  "dueDate" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "paymentProofUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("userId", "month", "year")
);
CREATE INDEX IF NOT EXISTS "resident_bills_userId_status_idx" ON "resident_bills"("userId", "status");

CREATE TABLE IF NOT EXISTS "payment_orders" (
  "id" TEXT PRIMARY KEY,
  "requestKey" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON UPDATE CASCADE,
  "billId" TEXT REFERENCES "resident_bills"("id") ON UPDATE CASCADE,
  "fundType" "FundType" NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL CHECK ("amount" > 0),
  "status" TEXT NOT NULL DEFAULT 'CREATING',
  "payerName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "anonymous" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT,
  "snapToken" TEXT,
  "redirectUrl" TEXT,
  "paymentType" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "payment_orders_userId_createdAt_idx" ON "payment_orders"("userId", "createdAt" DESC);
ALTER TABLE "payment_orders" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Pembayaran Livon';
CREATE UNIQUE INDEX IF NOT EXISTS "payment_orders_active_bill_key" ON "payment_orders"("billId") WHERE "status" IN ('CREATING', 'PENDING');

CREATE TABLE IF NOT EXISTS "financial_transactions" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "amount" DECIMAL(15,2) NOT NULL CHECK ("amount" > 0),
  "type" "TransactionType" NOT NULL,
  "fundType" "FundType" NOT NULL,
  "category" TEXT,
  "proofUrl" TEXT,
  "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedById" TEXT REFERENCES "users"("id") ON UPDATE CASCADE,
  "residentBillId" TEXT REFERENCES "resident_bills"("id") ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
ALTER TABLE "financial_transactions" ADD COLUMN IF NOT EXISTS "paymentOrderId" TEXT REFERENCES "payment_orders"("id") ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "financial_transactions_paymentOrderId_key" ON "financial_transactions"("paymentOrderId");
CREATE UNIQUE INDEX IF NOT EXISTS "financial_transactions_residentBillId_income_key" ON "financial_transactions"("residentBillId") WHERE "type" = 'PEMASUKAN' AND "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "financial_transactions_fundType_type_idx" ON "financial_transactions"("fundType", "type");
CREATE INDEX IF NOT EXISTS "financial_transactions_transactionDate_idx" ON "financial_transactions"("transactionDate" DESC);

COMMIT;
