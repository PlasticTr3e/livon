import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DonationPageContent } from "@/components/crowdfunding/DonationPageContent";
import { CHECKOUT_SLUG } from "@/lib/payment/billing";

type DonationPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Donasi · Livon",
  description: "Donasi untuk Kantong solidaritas warga.",
};

// Only `/crowdfunding/donasi` exists; any other id returns 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: CHECKOUT_SLUG.donation }];
}

export default async function DonationPage({ params }: DonationPageProps) {
  const { id } = await params;
  if (id !== CHECKOUT_SLUG.donation) notFound();

  return <DonationPageContent />;
}
