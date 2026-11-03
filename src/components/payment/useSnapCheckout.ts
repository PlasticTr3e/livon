"use client";

import { useEffect, useEffectEvent, useState } from "react";
import {
  createSnapCheckout,
  getSnapCheckoutStatus,
  type SnapCheckoutInput,
} from "@/app/(app)/payment/actions";
import { useToast } from "@/components/shared/AppToaster";
import { getStoredPaymentToken } from "@/lib/payment/payment-api";

export type SnapPaidResult = {
  orderId: string;
  amount: number;
  paymentType?: string;
};

export type SnapPendingOrder = {
  orderId: string;
  snapToken: string;
  amount: number;
};

const STATUS_POLL_INTERVAL_MS = 5000;

function isSnapReady() {
  return (
    typeof window !== "undefined" && typeof window.snap?.pay === "function"
  );
}

/**
 * Opens the Midtrans Snap popup and reports back once the payment settles,
 * either straight from the popup or by polling while it is pending (e.g. a
 * Virtual Account paid later in the Midtrans simulator).
 */
export function useSnapCheckout({
  onPaid,
}: {
  onPaid: (result: SnapPaidResult) => void;
}) {
  const toast = useToast();
  const [isStarting, setIsStarting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<SnapPendingOrder | null>(
    null,
  );

  function completePayment(order: SnapPendingOrder, paymentType?: string) {
    setPendingOrder(null);
    onPaid({ orderId: order.orderId, amount: order.amount, paymentType });
  }

  function failPayment() {
    setPendingOrder(null);
    toast.error(
      "Pembayaran gagal",
      "Transaksi dibatalkan atau kedaluwarsa. Silakan coba lagi.",
    );
  }

  function openPopup(order: SnapPendingOrder) {
    if (!isSnapReady()) {
      toast.error(
        "Midtrans belum siap",
        "Halaman pembayaran masih dimuat. Coba lagi sebentar.",
      );
      return;
    }

    window.snap.pay(order.snapToken, {
      onSuccess: (result) => completePayment(order, result.payment_type),
      onPending: () => setPendingOrder(order),
      onError: failPayment,
      onClose: () =>
        toast.info(
          "Pembayaran belum selesai",
          "Popup ditutup sebelum pembayaran diselesaikan.",
        ),
    });
  }

  async function startCheckout(input: SnapCheckoutInput) {
    const authToken = getStoredPaymentToken();
    if (!authToken) {
      toast.error("Perlu masuk", "Masuk ke akun LIVON untuk membayar.");
      return;
    }

    setIsStarting(true);
    try {
      const result = await createSnapCheckout(authToken, input);
      if (!result.ok) {
        toast.error("Pembayaran tidak dapat dibuat", result.error);
        return;
      }

      openPopup({
        orderId: result.orderId,
        snapToken: result.token,
        amount: result.amount,
      });
    } catch (error) {
      console.error("Snap checkout failed:", error);
      toast.error(
        "Koneksi bermasalah",
        "Periksa internet Anda lalu coba lagi.",
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function checkStatus(order: SnapPendingOrder) {
    const result = await getSnapCheckoutStatus(
      getStoredPaymentToken(),
      order.orderId,
    );
    if (result.status === "paid") completePayment(order, result.paymentType);
    if (result.status === "failed") failPayment();
    return result.status;
  }

  const pollStatus = useEffectEvent((order: SnapPendingOrder) => {
    void checkStatus(order);
  });

  useEffect(() => {
    if (!pendingOrder) return;

    const timer = window.setInterval(
      () => pollStatus(pendingOrder),
      STATUS_POLL_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [pendingOrder]);

  async function checkPendingNow() {
    if (!pendingOrder) return;

    setIsChecking(true);
    try {
      const status = await checkStatus(pendingOrder);
      if (status === "pending" || status === "unknown") {
        toast.info(
          "Belum ada pembayaran",
          "Selesaikan pembayaran di simulator Midtrans, lalu cek lagi.",
        );
      }
    } finally {
      setIsChecking(false);
    }
  }

  return {
    isStarting,
    isChecking,
    pendingOrder,
    startCheckout,
    resumePending: () => pendingOrder && openPopup(pendingOrder),
    checkPendingNow,
    cancelPending: () => setPendingOrder(null),
  };
}
