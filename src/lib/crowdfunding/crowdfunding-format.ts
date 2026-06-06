import type {
  CrowdfundingProject,
  CrowdfundingProjectStats,
} from "./crowdfunding-types";

export const CROWDFUNDING_PRESET_AMOUNTS = [25000, 50000, 100000, 500000];

export const CAMPAIGN_IMAGES: Record<string, string[]> = {
  "2": [
    "https://images.unsplash.com/photo-1759702132600-731687499b41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  default: [
    "https://images.unsplash.com/photo-1774697442958-283860cf8409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
};

export function getCrowdfundingProjectStats(
  project: CrowdfundingProject,
): CrowdfundingProjectStats {
  const collected = Number(project.currentFunding || 0);
  const target = Number(project.budgetTarget || 0);
  const progress =
    target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

  return { collected, progress, target };
}

export function getCrowdfundingImages(project: CrowdfundingProject) {
  if (project.imageUrls && project.imageUrls.length > 0) {
    return project.imageUrls;
  }

  return CAMPAIGN_IMAGES[project.id] || CAMPAIGN_IMAGES.default;
}

export function getCrowdfundingCoverImage(project: CrowdfundingProject) {
  return getCrowdfundingImages(project)[0];
}

export function formatCrowdfundingAmount(amount: number) {
  return amount.toLocaleString("id-ID");
}

export function isFundingProject(project: CrowdfundingProject) {
  return project.status?.toUpperCase() === "DISETUJUI";
}

export function filterCrowdfundingProjects(
  projects: CrowdfundingProject[],
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.toLowerCase();

  return projects
    .filter(isFundingProject)
    .filter(
      (project) =>
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.description.toLowerCase().includes(normalizedQuery),
    );
}

export function getCampaignStatusLabel(project: CrowdfundingProject) {
  return isFundingProject(project) ? "Active" : project.status || "Active";
}
