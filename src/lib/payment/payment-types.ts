/** Types for the Midtrans Snap popup loaded by `MidtransSnapScript`. */

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
