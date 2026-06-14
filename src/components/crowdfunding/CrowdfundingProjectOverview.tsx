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
    <div className="flex h-full flex-col justify-center space-y-5">
      <div>
        <Badge className="mb-2 border-yellow-300 bg-yellow-100 text-yellow-700">
          {getCampaignStatusLabel(project)}
        </Badge>
        <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white md:text-3xl">
          {project.title}
        </h1>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-slate-300">
        {project.description}
      </p>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#0B1120]">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <CrowdfundingStatCard
            label="Collected"
            value={`Rp ${formatCrowdfundingAmount(stats.collected)}`}
            valueClassName="text-green-700 dark:text-green-400"
          />
          <CrowdfundingStatCard
            label="Target"
            value={`Rp ${formatCrowdfundingAmount(stats.target)}`}
            valueClassName="text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-1.5 flex justify-between text-sm font-semibold">
          <span className="text-gray-600 dark:text-slate-300">
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
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`truncate text-sm font-black sm:text-base ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
