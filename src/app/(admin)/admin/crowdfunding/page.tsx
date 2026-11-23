import { redirect } from "next/navigation";

/** Old admin Billing & Care URL; the dashboard now lives at /admin/billing. */
export default function CrowdfundingMonitorPage() {
  redirect("/admin/billing");
}
