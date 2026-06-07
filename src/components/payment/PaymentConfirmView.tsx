import { CheckCircle2, Clock } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import {
  formatCountdownTime,
  formatDonationAmount,
} from "@/lib/payment/payment-format";
import type { PaymentProject } from "@/lib/payment/payment-types";
import { DonationSummaryCard } from "./DonationSummaryCard";
import { PaymentTopBar } from "./PaymentTopBar";
import { PaymentTrustBadges } from "./PaymentTrustBadges";

type PaymentConfirmViewProps = {
  amount: number;
  isProcessing: boolean;
  project: PaymentProject;
  timeLeft: number;
  onBack: () => void;
  onConfirm: () => void;
};

export function PaymentConfirmView({
  amount,
  isProcessing,
  project,
  timeLeft,
  onBack,
  onConfirm,
}: PaymentConfirmViewProps) {
  const formattedAmount = formatDonationAmount(amount);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <PaymentTopBar label="Back" onBack={onBack} />

      <div className="mx-auto w-full max-w-lg space-y-5 px-4 py-6">
        <DonationSummaryCard amount={amount} projectName={project.name} />

        <div className="space-y-4">
          <Card className="border-green-100 p-5">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">
              Payment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-white">
                  Donation Amount
                </span>
                <span className="text-sm font-semibold dark:text-white">
                  Rp {formattedAmount}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-slate-600">
                <span className="font-bold text-gray-900 dark:text-white">
                  Total Payment
                </span>
                <span className="text-lg font-black text-green-600">
                  Rp {formattedAmount}
                </span>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-gray-500 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-white">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>
              Complete payment within{" "}
              <strong>{formatCountdownTime(timeLeft)}</strong>
            </span>
          </div>

          <Button
            variant="primary"
            className="flex h-14 w-full items-center justify-center gap-2 bg-green-600 text-lg font-black hover:bg-green-700"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Confirm Payment
              </>
            )}
          </Button>
        </div>

        <PaymentTrustBadges />
      </div>
    </div>
  );
}
