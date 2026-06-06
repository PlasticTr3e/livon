"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  createDonationPayment,
  fetchPaymentProject,
  getStoredPaymentToken,
} from "@/lib/payment/payment-api";
import { getPaymentReceiptTime } from "@/lib/payment/payment-format";
import type {
  MidtransResult,
  PaymentProject,
  PaymentReceipt,
  PaymentStep,
} from "@/lib/payment/payment-types";
import { PaymentConfirmView } from "./PaymentConfirmView";
import { PaymentErrorState } from "./PaymentErrorState";
import { PaymentLoadingState } from "./PaymentLoadingState";
import { PaymentSuccessView } from "./PaymentSuccessView";

const PAYMENT_COUNTDOWN_SECONDS = 1800;

export function PaymentPageContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const amount = Number.parseInt(searchParams.get("amount") || "0", 10);
  const isFromMidtransSuccess = ["settlement", "capture"].includes(
    searchParams.get("transaction_status") || "",
  );

  const [project, setProject] = useState<PaymentProject | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [timeLeft, setTimeLeft] = useState(PAYMENT_COUNTDOWN_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<PaymentStep>(
    isFromMidtransSuccess ? "success" : "confirm",
  );
  const [receipt, setReceipt] = useState<PaymentReceipt | null>({
    orderId: searchParams.get("order_id") || "",
    time: getPaymentReceiptTime(),
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((currentTimeLeft) => currentTimeLeft - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    async function loadProject() {
      try {
        const nextProject = await fetchPaymentProject(
          id,
          getStoredPaymentToken(),
        );
        setProject(nextProject);
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setIsLoadingProject(false);
      }
    }

    if (id) loadProject();
  }, [id]);

  async function handleConfirmPayment() {
    setIsProcessing(true);

    try {
      const token = getStoredPaymentToken();
      if (!token) {
        alert("Please login to continue your donation.");
        return;
      }

      const snapToken = await createDonationPayment({
        amount,
        projectId: id,
        token,
      });

      window.snap.pay(snapToken, {
        onSuccess: handlePaymentSuccess,
        onPending: () => {
          alert(
            "Waiting for payment! Please complete your payment through the selected VA.",
          );
        },
        onError: () => {
          alert("Payment failed. Please try again.");
        },
        onClose: () => {
          alert("You closed the payment popup without completing it.");
        },
      });
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred while processing the donation.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePaymentSuccess(result: MidtransResult) {
    setReceipt({
      orderId: result.order_id,
      time: getPaymentReceiptTime(),
    });
    setStep("success");
  }

  if (isLoadingProject) {
    return <PaymentLoadingState />;
  }

  if (!project) {
    return <PaymentErrorState onBack={() => router.back()} />;
  }

  if (step === "success") {
    return (
      <PaymentSuccessView amount={amount} project={project} receipt={receipt} />
    );
  }

  return (
    <PaymentConfirmView
      amount={amount}
      isProcessing={isProcessing}
      project={project}
      timeLeft={timeLeft}
      onBack={() => router.back()}
      onConfirm={handleConfirmPayment}
    />
  );
}
