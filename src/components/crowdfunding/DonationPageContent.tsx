"use client";

import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import { PaymentSubHeader } from "@/components/payment/PaymentSubHeader";
import { PAYMENT_ROUTES } from "@/lib/payment/billing";
import { useDonationFeed, useFinanceSummary } from "@/lib/payment/finance-data";
import { DonationForm } from "./DonationForm";
import { DonationHero } from "./DonationHero";
import { RecentDonorsList } from "./RecentDonorsList";

const RECENT_DONOR_LIMIT = 5;

export function DonationPageContent() {
  const finance = useFinanceSummary();
  const feed = useDonationFeed(RECENT_DONOR_LIMIT);

  return (
    <PaymentPageShell
      header={<PaymentSubHeader backHref={PAYMENT_ROUTES.hub} badge="secure" />}
    >
      <div className="space-y-5">
        <DonationHero
          balance={finance.summary?.donationBalance ?? 0}
          donationCount={feed.donationCount}
          isLoading={
            (finance.isLoading && !finance.summary) ||
            (feed.isLoading && !feed.data)
          }
        />
        <DonationForm />
        <RecentDonorsList
          donations={feed.donations}
          isLoading={feed.isLoading && !feed.data}
          error={feed.error}
          onRetry={feed.reload}
        />
      </div>
    </PaymentPageShell>
  );
}
