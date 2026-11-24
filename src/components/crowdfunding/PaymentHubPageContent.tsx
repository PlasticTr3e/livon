"use client";

import {
  CircleCheck,
  CircleDashed,
  HandHeart,
  Hourglass,
  Landmark,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { FinanceLoadError } from "@/components/payment/FinanceLoadError";
import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import {
  formatBillingPeriod,
  formatCompactRupiah,
  toBillingPeriod,
} from "@/lib/payment/billing";
import { useBillingRole } from "@/lib/payment/billing-role";
import {
  useDonationFeed,
  useFinanceSummary,
  useMyIplBills,
} from "@/lib/payment/finance-data";
import { DonationPocketCard } from "./DonationPocketCard";
import { ExpenditureTransparencyTable } from "./ExpenditureTransparencyTable";
import { FinanceStatCard, type FinanceStatTone } from "./FinanceStatCard";
import { getIplStatus, type IplStatusKind } from "./ipl-status";
import { IplPocketCard } from "./IplPocketCard";
import { PaymentHubHeader } from "./PaymentHubHeader";

const IPL_STATUS_CARD: Record<
  IplStatusKind,
  { value: string; icon: LucideIcon; tone: FinanceStatTone }
> = {
  guest: { value: "—", icon: CircleDashed, tone: "amber" },
  admin: { value: "—", icon: CircleDashed, tone: "amber" },
  "not-warga": { value: "—", icon: CircleDashed, tone: "amber" },
  none: { value: "Belum ada", icon: CircleDashed, tone: "amber" },
  unpaid: { value: "Belum lunas", icon: CircleDashed, tone: "down" },
  awaiting: { value: "Diproses", icon: Hourglass, tone: "amber" },
  paid: { value: "Lunas", icon: CircleCheck, tone: "green" },
};

const IPL_STATUS_CAPTION: Partial<Record<IplStatusKind, string>> = {
  guest: "Masuk untuk melihat",
  admin: "Khusus akun warga",
  "not-warga": "Khusus akun warga",
  none: "Tagihan belum terbit",
};

export function PaymentHubPageContent() {
  const {
    isAuthenticated,
    isLoading: isRoleLoading,
    isWarga,
    isAdmin,
  } = useBillingRole();

  const finance = useFinanceSummary();
  const donationFeed = useDonationFeed(1);
  const bills = useMyIplBills(isWarga);

  const iplStatus = getIplStatus({
    isAuthenticated,
    isWarga,
    isAdmin,
    unpaidBills: bills.unpaidBills,
    awaitingBills: bills.awaitingBills,
    latestBill: bills.latestBill,
  });
  const isIplLoading = isRoleLoading || bills.isLoading;
  const statusCard = IPL_STATUS_CARD[iplStatus.kind];
  const summary = finance.summary;

  function retryAll() {
    finance.reload();
    donationFeed.reload();
    if (isWarga) bills.reload();
  }

  const loadError = finance.error || donationFeed.error || bills.error;

  return (
    <PaymentPageShell width="wide" header={<PaymentHubHeader />}>
      <div className="space-y-5 md:space-y-8">
        {loadError && (
          <FinanceLoadError message={loadError} onRetry={retryAll} />
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          <FinanceStatCard
            label="Saldo kas IPL"
            value={formatCompactRupiah(summary?.iplBalance ?? 0)}
            icon={Landmark}
            tone="brown"
            isLoading={finance.isLoading && !summary}
          />
          <FinanceStatCard
            label="Saldo kas donasi"
            value={formatCompactRupiah(summary?.donationBalance ?? 0)}
            icon={HandHeart}
            tone="blue"
            isLoading={finance.isLoading && !summary}
          />
          <FinanceStatCard
            label="Pengeluaran bulan ini"
            value={formatCompactRupiah(summary?.monthlyExpense ?? 0)}
            caption={formatBillingPeriod(toBillingPeriod(new Date()))}
            icon={ReceiptText}
            tone="amber"
            isLoading={finance.isLoading && !summary}
          />
          <FinanceStatCard
            label="Status IPL"
            value={statusCard.value}
            caption={
              IPL_STATUS_CAPTION[iplStatus.kind] ??
              iplStatus.periodLabel ??
              undefined
            }
            icon={statusCard.icon}
            tone={statusCard.tone}
            isLoading={isIplLoading}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <IplPocketCard status={iplStatus} isLoading={isIplLoading} />
          <DonationPocketCard
            balance={summary?.donationBalance ?? 0}
            donationCount={donationFeed.donationCount}
            isLoading={
              (finance.isLoading && !summary) ||
              (donationFeed.isLoading && !donationFeed.data)
            }
          />
        </div>

        <ExpenditureTransparencyTable />
      </div>
    </PaymentPageShell>
  );
}
