import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { formatDonationAmount } from "@/lib/payment/payment-format";
import type {
  PaymentProject,
  PaymentReceipt,
} from "@/lib/payment/payment-types";
import { PaymentTopBar } from "./PaymentTopBar";

type PaymentSuccessViewProps = {
  amount: number;
  project: PaymentProject;
  receipt: PaymentReceipt | null;
};

export function PaymentSuccessView({
  amount,
  project,
  receipt,
}: PaymentSuccessViewProps) {
  const receiptItems = [
    { label: "Project", value: project.name },
    { label: "Donation Amount", value: `Rp ${formatDonationAmount(amount)}` },
    { label: "Transaction ID", value: receipt?.orderId || "-" },
    { label: "Time", value: receipt?.time || "-" },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 dark:bg-[#0B1120]">
      <PaymentTopBar backHref="/crowdfunding" label="Back to Menu" />

      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-200 bg-green-100 shadow-lg">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">
          Donation Successful!
        </h1>
        <p className="mb-6 leading-relaxed text-gray-500 dark:text-white">
          Thank you for supporting{" "}
          <strong className="text-green-700 dark:text-green-400">
            {project.name}
          </strong>
          .<br />
          Your contribution means a lot to the community!
        </p>

        <Card className="mb-6 border-green-200 p-5 text-left">
          <div className="space-y-3">
            {receiptItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-500 dark:text-white">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <p className="mb-1 font-semibold">Encourage others to donate!</p>
          <p className="text-xs text-green-600 dark:text-green-500">
            Invite your neighbors to donate and accelerate the realization of
            this project.
          </p>
        </div>
      </div>
    </div>
  );
}
