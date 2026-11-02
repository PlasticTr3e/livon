"use client";

import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import { PaymentSubHeader } from "@/components/payment/PaymentSubHeader";
import { PAYMENT_ROUTES } from "@/lib/payment/billing";
import { useFinance } from "@/lib/payment/finance-store";
import { DonationForm } from "./DonationForm";
import { DonationHero } from "./DonationHero";
import { RecentDonorsList } from "./RecentDonorsList";

export function DonationPageContent() {
  const finance = useFinance();

  return (
    <PaymentPageShell
      header={<PaymentSubHeader backHref={PAYMENT_ROUTES.hub} badge="secure" />}
    >
      <div className="space-y-5">
        <DonationHero
          collected={finance.donationIncome}
          donorCount={finance.donationCount}
        />
        <DonationForm />
        <RecentDonorsList donations={finance.donations} />
      </div>
    </PaymentPageShell>
  );
}
