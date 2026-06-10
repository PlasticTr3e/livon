import { HandCoins } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import type { CrowdfundingProject } from "@/lib/crowdfunding/crowdfunding-types";
import { CrowdfundingCampaignCard } from "./CrowdfundingCampaignCard";

type CrowdfundingCampaignListProps = {
  isLoading: boolean;
  projects: CrowdfundingProject[];
};

export function CrowdfundingCampaignList({
  isLoading,
  projects,
}: CrowdfundingCampaignListProps) {
  if (isLoading) {
    return <LoadingState label="Loading campaigns..." variant="panel" />;
  }

  if (projects.length === 0) {
    return (
      <div className="py-16 text-center">
        <HandCoins className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-slate-600" />
        <p className="font-medium text-gray-500 dark:text-slate-400">
          No active campaigns found.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {projects.map((project) => (
        <CrowdfundingCampaignCard key={project.id} project={project} />
      ))}
    </div>
  );
}
