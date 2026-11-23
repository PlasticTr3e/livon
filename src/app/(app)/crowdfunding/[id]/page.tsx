import { UiText } from "@/context/LanguageContext";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DonationPageContent } from "@/components/crowdfunding/DonationPageContent";
import { CHECKOUT_SLUG } from "@/lib/payment/billing";

type DonationPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Donasi · Livon",
  description: "Kontribusi sukarela untuk dana sosial lingkungan.",
};

// Only `/crowdfunding/donasi` exists; any other id returns 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: CHECKOUT_SLUG.donation }];
}

export default async function DonationPage({ params }: DonationPageProps) {
  const { id } = await params;
  if (id !== CHECKOUT_SLUG.donation) notFound();

  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-slate-700 dark:text-slate-200">
          <UiText>{"Memuat donasi…"}</UiText>
        </p>
      }
    >
      <DonationPageContent />
    </Suspense>
  );
}
