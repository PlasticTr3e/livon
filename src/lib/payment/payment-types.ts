export type PaymentStep = "confirm" | "success";

export type PaymentProject = {
  id: string;
  name: string;
};

export type PaymentReceipt = {
  orderId: string;
  time: string;
};

export type MidtransResult = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  pdf_url?: string;
  fraud_status?: string;
};

export type MidtransSnapOptions = {
  onSuccess?: (result: MidtransResult) => void;
  onPending?: (result: MidtransResult) => void;
  onError?: (result: MidtransResult) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: MidtransSnapOptions) => void;
    };
  }
}
