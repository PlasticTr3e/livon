import type { Metadata } from "next";
import { PaymentHubPageContent } from "@/components/crowdfunding/PaymentHubPageContent";

export const metadata: Metadata = {
  title: "Billing & Care · Livon",
  description: "Bayar iuran IPL dan berdonasi untuk warga.",
};

export default function PaymentHubPage() {
  return <PaymentHubPageContent />;
}
