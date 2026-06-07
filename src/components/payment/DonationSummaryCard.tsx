import { Leaf } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { formatDonationAmount } from "@/lib/payment/payment-format";

type DonationSummaryCardProps = {
  amount: number;
  projectName: string;
};

export function DonationSummaryCard({
  amount,
  projectName,
}: DonationSummaryCardProps) {
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-700 to-green-900 p-5 text-white">
      <div className="mb-3 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-300" />
        <p className="text-xs font-bold uppercase tracking-widest text-green-300">
          Donation Summary
        </p>
      </div>
      <p className="mb-1 text-sm font-bold text-green-200">{projectName}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-green-400">Rp</span>
        <span className="text-3xl font-black">
          {formatDonationAmount(amount)}
        </span>
      </div>
    </Card>
  );
}
