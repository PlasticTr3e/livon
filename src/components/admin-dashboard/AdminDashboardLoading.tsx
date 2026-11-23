"use client";

import { useLanguage } from "@/context/LanguageContext";
import { LoadingState } from "@/components/shared/LoadingState";

export function AdminDashboardLoading() {
  const { t: translateUi } = useLanguage();

  return (
    <LoadingState
      label={translateUi("Loading dashboard...")}
      className="h-screen"
    />
  );
}
