import { Target, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import {
  formatCrowdfundingAmount,
  getCampaignStatusLabel,
} from "@/lib/crowdfunding/crowdfunding-format";
import type {
  CrowdfundingProject,
  CrowdfundingProjectStats,
} from "@/lib/crowdfunding/crowdfunding-types";

type CrowdfundingProjectOverviewProps = {
  project: CrowdfundingProject;
  stats: CrowdfundingProjectStats;
};

export function CrowdfundingProjectOverview({
  project,
  stats,
}: CrowdfundingProjectOverviewProps) {
  return (
    <div className="space-y-4 md:col-span-3">
      <div>
        <Badge className="mb-2 border-yellow-300 bg-yellow-100 text-yellow-700">
          {getCampaignStatusLabel(project)}
        </Badge>
        <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white">
          {project.title}
        </h1>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-white">
        {project.description}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <CrowdfundingStatCard
          icon={TrendingUp}
          label="Collected"
          value={`Rp ${formatCrowdfundingAmount(stats.collected)}`}
          tone="green"
        />
        <CrowdfundingStatCard
          icon={Target}
          label="Target"
          value={`Rp ${formatCrowdfundingAmount(stats.target)}`}
          tone="yellow"
        />
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-sm font-semibold">
          <span className="text-gray-600 dark:text-white">
            Funding Progress
          </span>
          <span className="text-green-600">{stats.progress}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-yellow-400"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CrowdfundingStatCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: React.ElementType;
  label: string;
  tone: "green" | "yellow";
  value: string;
}) {
  const toneClass =
    tone === "green"
      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 text-green-700 dark:text-green-400"
      : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3 ${toneClass}`}
    >
      <div className="text-left">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-black">{value}</p>
      </div>
      <div className="rounded-md border border-current/20 bg-white p-1.5 shadow-sm dark:bg-current/10">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
