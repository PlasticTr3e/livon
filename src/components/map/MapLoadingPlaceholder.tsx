"use client";

import { useLanguage } from "@/context/LanguageContext";
import { LoadingState } from "@/components/shared/LoadingState";

export function MapLoadingPlaceholder() {
  const { t: translateUi } = useLanguage();

  return (
    <LoadingState
      label={translateUi("Loading map...")}
      className="h-full w-full"
    />
  );
}
