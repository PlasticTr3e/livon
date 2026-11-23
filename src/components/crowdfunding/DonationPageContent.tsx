"use client";
import { useLanguage } from "@/context/LanguageContext";

import { HandCoins } from "lucide-react";
import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import { PaymentFlowHeader } from "@/components/payment/PaymentFlowHeader";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { BackBar } from "@/components/shared/BackBar";
import { PAYMENT_ROUTES } from "@/lib/payment/billing";
import { DonationForm } from "./DonationForm";
import { useFinanceHub } from "./useFinanceHub";
import { FinanceLoadState } from "./FinanceLoadState";

export function DonationPageContent() {
  const { t: translateUi } = useLanguage();

  const { data, error, refresh } = useFinanceHub();
  return (
    <PaymentPageShell
      width="narrow"
      header={
        <>
          <BackBar
            href={`${PAYMENT_ROUTES.hub}#donasi`}
            label={translateUi("Kembali ke Kantong Donasi")}
          />
          <PaymentFlowHeader
            title={translateUi("Donasi warga")}
            description={translateUi(
              "Kontribusi sukarela untuk dana sosial lingkungan. Donasi tidak menggantikan kewajiban IPL.",
            )}
            icon={HandCoins}
          />
        </>
      }
    >
      {!data ? (
        <FeatureCard>
          <FinanceLoadState error={error} retry={() => void refresh()} />
        </FeatureCard>
      ) : (
        <div className="space-y-5 pb-6">
          <FeatureCard>
            <DonationForm />
          </FeatureCard>
        </div>
      )}
    </PaymentPageShell>
  );
}
