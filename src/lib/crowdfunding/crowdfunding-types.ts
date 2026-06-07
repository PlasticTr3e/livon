export type CrowdfundingProject = {
  id: string;
  title: string;
  description: string;
  status?: string;
  budgetTarget?: number | string;
  currentFunding?: number | string;
  imageUrls?: string[];
  createdAt?: string;
};

export type CrowdfundingProjectStats = {
  collected: number;
  progress: number;
  target: number;
};
