import type {
  AdminCrowdfundingOverviewStats,
  AdminCrowdfundingProject,
  AdminCrowdfundingProjectStatusFilter,
  AdminCrowdfundingRawDonation,
  AdminCrowdfundingSelectedProject,
  AdminCrowdfundingTransaction,
  AdminCrowdfundingTransactionSort,
  AdminCrowdfundingTransactionStatus,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

export function getAdminCrowdfundingProjectStats(
  project: AdminCrowdfundingProject,
) {
  const target = Number(project.budgetTarget) || 0;
  const collected = Number(project.currentFunding) || 0;
  const progress =
    target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

  return { target, collected, progress };
}

export function getAdminCrowdfundingOverviewStats(
  projects: AdminCrowdfundingProject[],
): AdminCrowdfundingOverviewStats {
  return {
    totalCollected: projects.reduce(
      (sum, project) => sum + (Number(project.currentFunding) || 0),
      0,
    ),
    activeCampaignsCount: projects.filter(
      (project) => project.status?.toUpperCase() === "DISETUJUI",
    ).length,
    pendingVerificationCount: projects.filter(
      (project) => project.status?.toUpperCase() === "USULAN",
    ).length,
  };
}

export function getAdminDonationDisplayStatus(
  status: string,
): AdminCrowdfundingTransactionStatus {
  if (status === "SUCCESS") return "Success";
  if (status === "FAILED") return "Failed";
  return "Pending";
}

export function getAdminDonationStatusClass(
  status: AdminCrowdfundingTransactionStatus,
) {
  switch (status) {
    case "Success":
      return "bg-green-100 text-green-700 border-green-300";
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "Failed":
      return "bg-red-100 text-red-600 border-red-300";
  }
}

export function getAdminProjectDisplayStatus(status?: string) {
  const normalizedStatus = status?.toUpperCase() || "";

  if (normalizedStatus === "DISETUJUI") return "Active";
  if (normalizedStatus === "SELESAI") return "Completed";
  if (normalizedStatus === "KONSTRUKSI") return "In Construction";
  if (normalizedStatus === "USULAN") return "Pending";

  return status || "Unknown";
}

export function formatAdminCrowdfundingAmount(amount: number) {
  return amount.toLocaleString("id-ID");
}

export function mapAdminDonationToTransaction(
  donation: AdminCrowdfundingRawDonation,
): AdminCrowdfundingTransaction {
  const rawDate = new Date(donation.createdAt);

  return {
    id: donation.orderId || donation.id,
    user: donation.user?.citizenProfile?.fullName || "Anonymous Resident",
    project: donation.project?.title || "Unknown Project",
    projectId: donation.projectId || donation.project?.id || "",
    amount: Number(donation.amount),
    rawDate,
    date: rawDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: getAdminDonationDisplayStatus(donation.status),
  };
}

export function filterAdminCrowdfundingProjects(
  projects: AdminCrowdfundingProject[],
  statusFilter: AdminCrowdfundingProjectStatusFilter,
  searchQuery: string,
) {
  const normalizedQuery = searchQuery.toLowerCase();

  return projects.filter((project) => {
    const normalizedStatus = project.status?.toUpperCase() || "";
    const matchesStatus =
      statusFilter === "active"
        ? normalizedStatus === "DISETUJUI"
        : normalizedStatus === "SELESAI" || normalizedStatus === "KONSTRUKSI";

    return (
      matchesStatus && project.title.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function filterAndSortAdminCrowdfundingTransactions(
  transactions: AdminCrowdfundingTransaction[],
  selectedProject: AdminCrowdfundingSelectedProject | null,
  searchQuery: string,
  sort: AdminCrowdfundingTransactionSort,
) {
  if (!selectedProject) return [];

  const normalizedQuery = searchQuery.toLowerCase();

  return transactions
    .filter(
      (transaction) =>
        transaction.projectId === selectedProject.id ||
        transaction.project === selectedProject.name,
    )
    .filter(
      (transaction) =>
        !normalizedQuery ||
        transaction.user.toLowerCase().includes(normalizedQuery) ||
        transaction.id.toLowerCase().includes(normalizedQuery),
    )
    .sort((firstTransaction, secondTransaction) => {
      switch (sort) {
        case "oldest":
          return (
            firstTransaction.rawDate.getTime() -
            secondTransaction.rawDate.getTime()
          );
        case "highest":
          return secondTransaction.amount - firstTransaction.amount;
        case "lowest":
          return firstTransaction.amount - secondTransaction.amount;
        default:
          return (
            secondTransaction.rawDate.getTime() -
            firstTransaction.rawDate.getTime()
          );
      }
    });
}
