"use client";

import { useState } from "react";
import { BadgeCheck, HandCoins } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { PAYMENT_ROUTES, type CheckoutKind } from "@/lib/payment/billing";
import type { DonationCheckoutDetails } from "@/lib/payment/checkout-query";
import { recordPayment, useFinance } from "@/lib/payment/finance-store";
import {
  buildDonationOrder,
  buildIplOrder,
  type CheckoutOrder,
  type CheckoutReceipt,
} from "./checkout-order";
import { CheckoutEmptyState } from "./CheckoutEmptyState";
import { CheckoutReviewView } from "./CheckoutReviewView";
import { CheckoutSuccessView } from "./CheckoutSuccessView";
import { PaymentPageShell } from "./PaymentPageShell";
import { PaymentSubHeader } from "./PaymentSubHeader";
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
  const { userName, isAuthenticated, isUserLoading } = useUser();
  const { outstandingIplPeriods } = useFinance();
  const [paid, setPaid] = useState<PaidCheckout | null>(null);
  const countdown = useCountdown(PAYMENT_WINDOW_SECONDS, !paid);

  let order: CheckoutOrder | null = null;
  if (kind === "ipl" && outstandingIplPeriods.length > 0) {
    order = buildIplOrder(outstandingIplPeriods, userName);
  } else if (kind === "donation" && donation) {
    order = buildDonationOrder(donation, userName);
  }

  function handlePaid(result: SnapPaidResult) {
    if (!order || paid) return;

    recordPayment({
      orderId: result.orderId,
      fund: order.kind,
      amount: result.amount,
      user: order.payerName,
      anonymous: order.donation?.anonymous,
      message: order.donation?.message,
      periods: order.periods,
      paymentMethod: result.paymentType,
    });
    setPaid({
      order,
      receipt: {
        orderId: result.orderId,
        amount: result.amount,
        paymentType: result.paymentType,
      },
    });
  }

  const checkout = useSnapCheckout({ onPaid: handlePaid });

  function handleConfirm() {
    if (!order) return;

    void checkout.startCheckout(
      order.kind === "ipl"
        ? { kind: "ipl", periods: order.periods ?? [], customerName: userName }
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
        <CheckoutSuccessView order={paid.order} receipt={paid.receipt} />
      </PaymentPageShell>
    );
  }

  const backHref =
    kind === "ipl" ? PAYMENT_ROUTES.hub : PAYMENT_ROUTES.donationDetail;

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
      {order ? (
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
      ) : kind === "ipl" ? (
        <CheckoutEmptyState
          icon={BadgeCheck}
          title="Tagihan IPL sudah lunas"
          description="Tidak ada iuran yang perlu dibayar saat ini. Tagihan berikutnya terbit awal bulan."
          actionHref={PAYMENT_ROUTES.hub}
          actionLabel="Kembali"
        />
      ) : (
        <CheckoutEmptyState
          icon={HandCoins}
          title="Nominal donasi tidak valid"
          description="Pilih ulang nominal donasi Anda untuk melanjutkan."
          actionHref={PAYMENT_ROUTES.donationDetail}
          actionLabel="Pilih nominal"
        />
      )}
    </PaymentPageShell>
  );
}
