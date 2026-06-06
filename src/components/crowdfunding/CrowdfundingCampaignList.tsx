import { HandCoins } from "lucide-react";
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
    return (
      <div className="py-16 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-green-600" />
          <p className="font-medium text-gray-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-16 text-center">
        <HandCoins className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="font-medium text-gray-500">No active campaigns found.</p>
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
