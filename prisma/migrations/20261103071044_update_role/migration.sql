/*
  Warnings:

  - The values [AGENCY] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('IPL', 'DONASI');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PEMASUKAN', 'PENGELUARAN');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('BELUM_BAYAR', 'LUNAS', 'MENUNGGU_VERIFIKASI');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'WARGA', 'DEVELOPER');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- CreateTable
CREATE TABLE "finance_summaries" (
    "id" TEXT NOT NULL,
    "fundType" "FundType" NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalIncome" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalExpense" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "fundType" "FundType" NOT NULL,
    "category" TEXT,
    "proofUrl" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "residentBillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resident_bills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'BELUM_BAYAR',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resident_bills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_summaries_fundType_key" ON "finance_summaries"("fundType");

-- CreateIndex
CREATE INDEX "financial_transactions_fundType_type_idx" ON "financial_transactions"("fundType", "type");

-- CreateIndex
CREATE INDEX "financial_transactions_transactionDate_idx" ON "financial_transactions"("transactionDate" DESC);

-- CreateIndex
CREATE INDEX "resident_bills_userId_status_idx" ON "resident_bills"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "resident_bills_userId_month_year_key" ON "resident_bills"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_residentBillId_fkey" FOREIGN KEY ("residentBillId") REFERENCES "resident_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resident_bills" ADD CONSTRAINT "resident_bills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
