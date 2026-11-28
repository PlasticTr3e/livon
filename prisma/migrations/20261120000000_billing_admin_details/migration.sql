-- Rincian tagihan IPL dan detail pembayaran untuk dashboard admin Billing & Care.
-- Idempoten: aman dijalankan ulang di database yang sudah punya kolom ini.
ALTER TABLE "resident_bills" ADD COLUMN IF NOT EXISTS "items" JSONB;
CREATE INDEX IF NOT EXISTS "resident_bills_paidAt_idx" ON "resident_bills"("paidAt");

ALTER TABLE "payment_orders" ADD COLUMN IF NOT EXISTS "paymentBank" TEXT;
ALTER TABLE "payment_orders" ADD COLUMN IF NOT EXISTS "gatewayTransactionId" TEXT;
