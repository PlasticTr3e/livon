import type { Metadata } from "next";
import { AdminBillingPageContent } from "@/components/admin-billing/AdminBillingPageContent";

export const metadata: Metadata = {
  title: "Manajemen Keuangan · Admin Livon",
  description: "Pantau pembayaran IPL, donasi, dan pergerakan dana warga.",
};

export default function AdminBillingPage() {
  return <AdminBillingPageContent />;
}
