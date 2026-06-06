import { Card } from "@/components/ui/primitives";
import { formatAdminCrowdfundingAmount } from "@/lib/admin-crowdfunding/admin-crowdfunding-format";
import type { AdminCrowdfundingOverviewStats } from "@/lib/admin-crowdfunding/admin-crowdfunding-types";
import { BarChart2, Clock, DollarSign } from "lucide-react";

type AdminCrowdfundingStatsProps = {
  stats: AdminCrowdfundingOverviewStats;
};

export function AdminCrowdfundingStats({ stats }: AdminCrowdfundingStatsProps) {
  const statCards = [
    {
      label: "Total Collected",
      value: `Rp ${formatAdminCrowdfundingAmount(stats.totalCollected)}`,
      icon: DollarSign,
      borderClass: "border-green-100",
      iconClass: "bg-green-50 text-green-600",
    },
    {
      label: "Active Campaigns",
      value: stats.activeCampaignsCount.toString(),
      icon: BarChart2,
      borderClass: "border-blue-100",
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Waiting Verification",
      value: stats.pendingVerificationCount.toString(),
      icon: Clock,
      borderClass: "border-yellow-100",
      iconClass: "bg-yellow-50 text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {statCards.map((stat) => {
        const StatIcon = stat.icon;

        return (
          <Card
            key={stat.label}
            className={`flex items-center gap-4 p-4 ${stat.borderClass}`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconClass}`}
            >
              <StatIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white">
                {stat.label}
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
