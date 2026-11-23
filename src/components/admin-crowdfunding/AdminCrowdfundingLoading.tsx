"use client";

import { useLanguage } from "@/context/LanguageContext";
import { LoadingState } from "@/components/shared/LoadingState";

export function AdminCrowdfundingLoading() {
  const { t: translateUi } = useLanguage();

  return (
    <LoadingState
      label={translateUi("Loading crowdfunding data...")}
      className="min-h-full"
    />
  );
}
