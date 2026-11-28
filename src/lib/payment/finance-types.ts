export type PaymentState =
  | "CREATING"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REVIEW";

export type PaymentRecord = {
  id: string;
  kind: "ipl" | "donation";
  billId: string | null;
  title: string;
  amount: number;
  status: PaymentState;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  paymentType: string | null;
  snapToken?: string | null;
  warning?: string;
};

export type CreatePaymentInput =
  | { kind: "ipl"; billId: string; requestId: string }
  | {
      kind: "donation";
      amount: number;
      anonymous: boolean;
      message: string;
      requestId: string;
    };

export const PAYMENT_STATE_LABELS: Record<PaymentState, string> = {
  CREATING: "Disiapkan",
  PENDING: "Menunggu pembayaran",
  PAID: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  REVIEW: "Perlu pemeriksaan pengelola",
};
