"use client";

import { useLanguage } from "@/context/LanguageContext";
import { BackBar } from "@/components/shared/BackBar";

type CommunityBackBarProps = {
  onBack: () => void;
};

export function CommunityBackBar({ onBack }: CommunityBackBarProps) {
  const { t: translateUi } = useLanguage();

  return <BackBar label={translateUi("Back to Community")} onBack={onBack} />;
}
