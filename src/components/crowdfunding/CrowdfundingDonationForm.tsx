"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Shield } from "lucide-react";
import { cn, Card } from "@/components/ui/primitives";
import {
  formatCrowdfundingAmount,
  isFundingProject,
} from "@/lib/crowdfunding/crowdfunding-format";
import type { CrowdfundingProject } from "@/lib/crowdfunding/crowdfunding-types";

type CrowdfundingDonationFormProps = {
  presetAmounts: number[];
  project: CrowdfundingProject;
};

export function CrowdfundingDonationForm({
  presetAmounts,
  project,
}: CrowdfundingDonationFormProps) {
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const finalAmount = Number.parseInt(customAmount || "0", 10);
  const canDonate = isFundingProject(project);

  function handlePresetClick(amount: number) {
    setSelectedPreset(amount);
    setCustomAmount(amount.toString());
  }

  function handleDonate() {
    if (!finalAmount || finalAmount < 10000) return;
    router.push(`/payment/${project.id}?amount=${finalAmount}`);
  }

  return (
    <Card className="relative overflow-hidden border-2 border-green-200 p-6 shadow-md">
      {!canDonate && <DonationUnavailableOverlay project={project} />}

      <h2 className="mb-5 flex items-center gap-2 font-black text-gray-900 dark:text-white">
        <HandCoins className="h-5 w-5 text-green-600" /> Donation Amount
      </h2>
      <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-white">
        Quick Amount (Rp)
      </label>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={cn(
              "h-14 rounded-xl border-2 text-sm font-bold transition-all",
              selectedPreset === amount
                ? "border-green-600 bg-green-600 text-white shadow-md ring-4 ring-green-100"
                : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white",
            )}
          >
            Rp {formatCrowdfundingAmount(amount)}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-white">
          Other Amount (Rp)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
            Rp
          </span>
          <input
            type="number"
            placeholder="Enter amount..."
            className="h-14 w-full rounded-xl border-2 border-gray-200 bg-white pl-12 pr-4 text-lg font-bold text-gray-900 transition-all focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white"
            value={customAmount}
            min="10000"
            onChange={(event) => {
              setCustomAmount(event.target.value);
              setSelectedPreset(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "-" || event.key === "e") {
                event.preventDefault();
              }
            }}
          />
        </div>
        {finalAmount > 0 && finalAmount < 10000 ? (
          <p className="mt-2 text-xs font-medium text-red-500">
            Amount cannot be less than Rp 10.000
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-500 dark:text-white">
            Minimum donation is Rp 10.000
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDonate}
        disabled={!finalAmount || finalAmount < 10000}
        className={cn(
          "flex h-16 w-full items-center justify-center gap-3 rounded-xl text-lg font-black uppercase tracking-widest transition-all",
          finalAmount >= 10000
            ? "bg-green-600 text-white shadow-lg hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-xl active:translate-y-0"
            : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-slate-700",
        )}
      >
        Pay Donation
      </button>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Shield className="h-3.5 w-3.5 text-green-500" />
        <span>Secure and encrypted payment - 100% Transparent</span>
      </div>
    </Card>
  );
}

function DonationUnavailableOverlay({
  project,
}: {
  project: CrowdfundingProject;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 p-6 text-center backdrop-blur-sm dark:bg-[#111827]/80">
      <HandCoins className="mb-3 h-12 w-12 text-gray-400" />
      <h3 className="mb-1 text-lg font-bold text-gray-800 dark:text-white">
        Donation Not Available
      </h3>
      <p className="text-sm text-gray-600 dark:text-white">
        This campaign status is {project.status || "Unknown"}. Donations can
        only be made to projects with Funding (Approved) status.
      </p>
    </div>
  );
}
