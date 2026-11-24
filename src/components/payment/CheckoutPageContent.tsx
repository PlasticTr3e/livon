"use client";

import { useState } from "react";
import { BadgeCheck, HandCoins, Hourglass, LogIn, UserX } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useBillingRole } from "@/lib/payment/billing-role";
import { PAYMENT_ROUTES, type CheckoutKind } from "@/lib/payment/billing";
import type { DonationCheckoutDetails } from "@/lib/payment/checkout-query";
import { useMyIplBills } from "@/lib/payment/finance-data";
import {
  buildDonationOrder,
  buildIplOrder,
  type CheckoutOrder,
  type CheckoutReceipt,
} from "./checkout-order";
import { CheckoutEmptyState } from "./CheckoutEmptyState";
import { CheckoutLoadingState } from "./CheckoutLoadingState";
import { CheckoutReviewView } from "./CheckoutReviewView";
import { CheckoutSuccessView, type RecordStatus } from "./CheckoutSuccessView";
import { FinanceLoadError } from "./FinanceLoadError";
import { PaymentPageShell } from "./PaymentPageShell";
import { PaymentSubHeader } from "./PaymentSubHeader";
import { recordCheckoutPayment } from "./record-checkout";
import { useCountdown } from "./useCountdown";
import { useSnapCheckout, type SnapPaidResult } from "./useSnapCheckout";

const PAYMENT_WINDOW_SECONDS = 59 * 60;

type CheckoutPageContentProps = {
  kind: CheckoutKind;
  /** Parsed from the URL on the server; null when the amount is invalid. */
  donation: DonationCheckoutDetails | null;
};

type PaidCheckout = { order: CheckoutOrder; receipt: CheckoutReceipt };

export function CheckoutPageContent({
  kind,
  donation,
}: CheckoutPageContentProps) {
  const { userName } = useUser();
  const {
    isAuthenticated,
    isLoading: isUserLoading,
    isWarga,
  } = useBillingRole();
  const bills = useMyIplBills(kind === "ipl" && isWarga);

  const [paid, setPaid] = useState<PaidCheckout | null>(null);
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("saving");
  const countdown = useCountdown(PAYMENT_WINDOW_SECONDS, !paid);

  let order: CheckoutOrder | null = null;
  if (kind === "ipl" && bills.unpaidBills.length > 0) {
    order = buildIplOrder(bills.unpaidBills, userName, bills.residenceLabel);
  } else if (kind === "donation" && donation) {
    order = buildDonationOrder(donation, userName);
  }

  async function saveRecord(checkout: PaidCheckout) {
    setRecordStatus("saving");
    try {
      await recordCheckoutPayment(checkout.order, checkout.receipt);
      setRecordStatus("saved");
    } catch (error) {
      console.error("Failed to record payment:", error);
      setRecordStatus("error");
    }
  }

  function handlePaid(result: SnapPaidResult) {
    if (!order || paid) return;

    const checkout: PaidCheckout = { order, receipt: result };
    setPaid(checkout);
    void saveRecord(checkout);
  }

  const checkout = useSnapCheckout({ onPaid: handlePaid });

  function handleConfirm() {
    if (!order) return;

    void checkout.startCheckout(
      order.kind === "ipl"
        ? {
            kind: "ipl",
            billIds: (order.bills ?? []).map((bill) => bill.id),
            customerName: userName,
          }
        : {
            kind: "donation",
            amount: order.amount,
            customerName: order.payerName,
          },
    );
  }

  if (paid) {
    return (
      <PaymentPageShell key="success" width="narrow" className="min-h-full">
        <CheckoutSuccessView
          order={paid.order}
          receipt={paid.receipt}
          recordStatus={recordStatus}
          onRetryRecord={() => void saveRecord(paid)}
        />
      </PaymentPageShell>
    );
  }

  const backHref =
    kind === "ipl" ? PAYMENT_ROUTES.hub : PAYMENT_ROUTES.donationDetail;

  function renderBody() {
    if (order) {
      return (
        <CheckoutReviewView
          order={order}
          countdownLabel={countdown.label}
          isExpired={countdown.isExpired}
          isStarting={checkout.isStarting}
          needsLogin={!isUserLoading && !isAuthenticated}
          pendingOrder={checkout.pendingOrder}
          isChecking={checkout.isChecking}
          onConfirm={handleConfirm}
          onResume={checkout.resumePending}
          onCheckStatus={() => void checkout.checkPendingNow()}
          onCancelPending={checkout.cancelPending}
        />
      );
    }

    if (kind === "donation") {
      return (
        <CheckoutEmptyState
          icon={HandCoins}
          title="Nominal donasi tidak valid"
          description="Pilih ulang nominal donasi Anda untuk melanjutkan."
          actionHref={PAYMENT_ROUTES.donationDetail}
          actionLabel="Pilih nominal"
        />
      );
    }

    if (isUserLoading || bills.isLoading) {
      return <CheckoutLoadingState label="Memuat tagihan IPL..." />;
    }

    if (!isAuthenticated) {
      return (
        <CheckoutEmptyState
          icon={LogIn}
          title="Masuk untuk membayar IPL"
          description="Tagihan IPL terhubung ke akun warga. Masuk dulu untuk melihat tagihan Anda."
          actionHref="/auth/login"
          actionLabel="Masuk"
        />
      );
    }

    if (!isWarga) {
      return (
        <CheckoutEmptyState
          icon={UserX}
          title="Khusus akun warga"
          description="Pembayaran IPL hanya tersedia untuk akun warga yang memiliki tagihan."
          actionHref={PAYMENT_ROUTES.hub}
          actionLabel="Kembali"
        />
      );
    }

    if (bills.error) {
      return (
        <FinanceLoadError
          className="mt-6"
          message={bills.error}
          onRetry={bills.reload}
        />
      );
    }

    if (bills.awaitingBills.length > 0) {
      return (
        <CheckoutEmptyState
          icon={Hourglass}
          title="Pembayaran sedang diverifikasi"
          description="Pengurus sedang memeriksa pembayaran IPL Anda. Status berubah menjadi lunas setelah diverifikasi."
          actionHref={PAYMENT_ROUTES.hub}
          actionLabel="Kembali"
        />
      );
    }

    return (
      <CheckoutEmptyState
        icon={BadgeCheck}
        title={
          bills.latestBill ? "Tagihan IPL sudah lunas" : "Belum ada tagihan"
        }
        description={
          bills.latestBill
            ? "Tidak ada iuran yang perlu dibayar saat ini. Tagihan berikutnya terbit dari pengurus."
            : "Pengurus belum menerbitkan tagihan IPL untuk akun Anda."
        }
        actionHref={PAYMENT_ROUTES.hub}
        actionLabel="Kembali"
      />
    );
  }

  return (
    <PaymentPageShell
      width="narrow"
      header={
        <PaymentSubHeader
          backHref={backHref}
          badge="encrypted"
          width="narrow"
        />
      }
    >
      {renderBody()}
    </PaymentPageShell>
  );
}
