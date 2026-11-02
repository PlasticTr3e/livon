"use client";

import {
  CircleCheck,
  CircleDashed,
  HandHeart,
  Landmark,
  ReceiptText,
} from "lucide-react";
import { PaymentPageShell } from "@/components/payment/PaymentPageShell";
import {
  formatBillingPeriod,
  formatCompactRupiah,
} from "@/lib/payment/billing";
import { useFinance } from "@/lib/payment/finance-store";
import { DonationPocketCard } from "./DonationPocketCard";
import { ExpenditureTransparencyTable } from "./ExpenditureTransparencyTable";
import { FinanceStatCard } from "./FinanceStatCard";
import { IplPocketCard } from "./IplPocketCard";
import { PaymentHubHeader } from "./PaymentHubHeader";

export function PaymentHubPageContent() {
  const finance = useFinance();
  const isIplPaid = finance.outstandingIplPeriods.length === 0;

  return (
    <PaymentPageShell width="wide" header={<PaymentHubHeader />}>
      <div className="space-y-5 md:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          <FinanceStatCard
            label="Saldo kas IPL"
            value={formatCompactRupiah(finance.iplBalance)}
            icon={Landmark}
            tone="brown"
          />
          <FinanceStatCard
            label="Saldo kas donasi"
            value={formatCompactRupiah(finance.donationBalance)}
            icon={HandHeart}
            tone="blue"
          />
          <FinanceStatCard
            label="Pengeluaran bulan ini"
            value={formatCompactRupiah(finance.monthExpense)}
            caption={formatBillingPeriod(finance.currentPeriod)}
            icon={ReceiptText}
            tone="amber"
          />
          <FinanceStatCard
            label="Status IPL"
            value={isIplPaid ? "Lunas" : "Belum lunas"}
            caption={formatBillingPeriod(finance.currentPeriod)}
            icon={isIplPaid ? CircleCheck : CircleDashed}
            tone={isIplPaid ? "green" : "down"}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <IplPocketCard
            outstandingPeriods={finance.outstandingIplPeriods}
            currentPeriod={finance.currentPeriod}
          />
          <DonationPocketCard
            collected={finance.donationIncome}
            donorCount={finance.donationCount}
          />
        </div>

        <ExpenditureTransparencyTable
          getExpenditures={finance.expendituresByFund}
        />
      </div>
    </PaymentPageShell>
  );
}
