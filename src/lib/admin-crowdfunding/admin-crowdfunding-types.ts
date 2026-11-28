export type AdminCrowdfundingProject = {
  id: string;
  title: string;
  status?: string;
  budgetTarget?: number;
  currentFunding?: number;
};

export type AdminCrowdfundingTransactionStatus =
  | "Success"
  | "Pending"
  | "Failed";

export type AdminCrowdfundingTransaction = {
  id: string;
  user: string;
  project: string;
  projectId: string;
  amount: number;
  date: string;
  rawDate: Date;
  status: AdminCrowdfundingTransactionStatus;
};

export type AdminCrowdfundingRawDonation = {
  id: string;
  orderId?: string;
  projectId?: string;
  user?: {
    citizenProfile?: {
      fullName?: string;
    };
  };
  project?: {
    id?: string;
    title?: string;
  };
  amount: number | string;
  createdAt: string | Date;
  status: string;
};

export type AdminCrowdfundingSelectedProject = {
  id: string;
  name: string;
};

export type AdminCrowdfundingProjectStatusFilter = "active" | "completed";

export type AdminCrowdfundingTransactionSort =
  | "latest"
  | "oldest"
  | "highest"
  | "lowest";

export type AdminCrowdfundingOverviewStats = {
  totalCollected: number;
  activeCampaignsCount: number;
  pendingVerificationCount: number;
};
