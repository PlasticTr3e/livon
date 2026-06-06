import { AdminCrowdfundingProjectFilters } from "@/components/admin-crowdfunding/AdminCrowdfundingProjectFilters";
import { AdminCrowdfundingProjectGrid } from "@/components/admin-crowdfunding/AdminCrowdfundingProjectGrid";
import { AdminCrowdfundingRecentTransactions } from "@/components/admin-crowdfunding/AdminCrowdfundingTransactionsTable";
import { AdminCrowdfundingStats } from "@/components/admin-crowdfunding/AdminCrowdfundingStats";
import type {
  AdminCrowdfundingOverviewStats,
  AdminCrowdfundingProject,
  AdminCrowdfundingProjectStatusFilter,
  AdminCrowdfundingSelectedProject,
  AdminCrowdfundingTransaction,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

type AdminCrowdfundingDashboardViewProps = {
  stats: AdminCrowdfundingOverviewStats;
  transactions: AdminCrowdfundingTransaction[];
  projects: AdminCrowdfundingProject[];
  projectSearchQuery: string;
  projectStatusFilter: AdminCrowdfundingProjectStatusFilter;
  onProjectSearchChange: (searchQuery: string) => void;
  onProjectStatusFilterChange: (
    statusFilter: AdminCrowdfundingProjectStatusFilter,
  ) => void;
  onSelectProject: (project: AdminCrowdfundingSelectedProject) => void;
};

export function AdminCrowdfundingDashboardView({
  stats,
  transactions,
  projects,
  projectSearchQuery,
  projectStatusFilter,
  onProjectSearchChange,
  onProjectStatusFilterChange,
  onSelectProject,
}: AdminCrowdfundingDashboardViewProps) {
  return (
    <div className="space-y-6">
      <AdminCrowdfundingStats stats={stats} />
      <AdminCrowdfundingRecentTransactions transactions={transactions} />

      <div className="flex flex-col items-start justify-between gap-4 pt-4 md:flex-row md:items-center">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          Donation Dashboard
        </h2>
        <AdminCrowdfundingProjectFilters
          searchQuery={projectSearchQuery}
          statusFilter={projectStatusFilter}
          onSearchChange={onProjectSearchChange}
          onStatusFilterChange={onProjectStatusFilterChange}
        />
      </div>

      <AdminCrowdfundingProjectGrid
        projects={projects}
        statusFilter={projectStatusFilter}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}
