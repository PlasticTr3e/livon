"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCrowdfundingBackBar } from "@/components/admin-crowdfunding/AdminCrowdfundingBackBar";
import { AdminCrowdfundingDashboardView } from "@/components/admin-crowdfunding/AdminCrowdfundingDashboardView";
import { AdminCrowdfundingHeader } from "@/components/admin-crowdfunding/AdminCrowdfundingHeader";
import { AdminCrowdfundingLoading } from "@/components/admin-crowdfunding/AdminCrowdfundingLoading";
import { AdminCrowdfundingProjectTransactionsView } from "@/components/admin-crowdfunding/AdminCrowdfundingProjectTransactionsView";
import { fetchAdminCrowdfundingData } from "@/lib/admin-crowdfunding/admin-crowdfunding-api";
import {
  filterAdminCrowdfundingProjects,
  filterAndSortAdminCrowdfundingTransactions,
  getAdminCrowdfundingOverviewStats,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-format";
import type {
  AdminCrowdfundingProject,
  AdminCrowdfundingProjectStatusFilter,
  AdminCrowdfundingSelectedProject,
  AdminCrowdfundingTransaction,
  AdminCrowdfundingTransactionSort,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

export function AdminCrowdfundingPageContent() {
  const [projects, setProjects] = useState<AdminCrowdfundingProject[]>([]);
  const [transactions, setTransactions] = useState<
    AdminCrowdfundingTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] =
    useState<AdminCrowdfundingSelectedProject | null>(null);
  const [projectStatusFilter, setProjectStatusFilter] =
    useState<AdminCrowdfundingProjectStatusFilter>("active");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [transactionSort, setTransactionSort] =
    useState<AdminCrowdfundingTransactionSort>("latest");
  const [transactionSearchQuery, setTransactionSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCrowdfundingData() {
      try {
        setIsLoading(true);
        const crowdfundingData = await fetchAdminCrowdfundingData();

        if (!isMounted) {
          return;
        }

        setProjects(crowdfundingData.projects);
        setTransactions(crowdfundingData.transactions);
      } catch (error) {
        console.error("Failed to fetch crowdfunding data:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCrowdfundingData();

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewStats = useMemo(
    () => getAdminCrowdfundingOverviewStats(projects),
    [projects],
  );
  const dashboardProjects = useMemo(
    () =>
      filterAdminCrowdfundingProjects(
        projects,
        projectStatusFilter,
        projectSearchQuery,
      ),
    [projectSearchQuery, projectStatusFilter, projects],
  );
  const projectTransactions = useMemo(
    () =>
      filterAndSortAdminCrowdfundingTransactions(
        transactions,
        selectedProject,
        transactionSearchQuery,
        transactionSort,
      ),
    [selectedProject, transactionSearchQuery, transactionSort, transactions],
  );

  if (isLoading) {
    return <AdminCrowdfundingLoading />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      {selectedProject && (
        <AdminCrowdfundingBackBar onBack={() => setSelectedProject(null)} />
      )}

      <div className="space-y-6 p-6 md:p-8">
        <AdminCrowdfundingHeader selectedProject={selectedProject} />

        {selectedProject ? (
          <AdminCrowdfundingProjectTransactionsView
            transactions={projectTransactions}
            searchQuery={transactionSearchQuery}
            sort={transactionSort}
            onSearchChange={setTransactionSearchQuery}
            onSortChange={setTransactionSort}
          />
        ) : (
          <AdminCrowdfundingDashboardView
            stats={overviewStats}
            transactions={transactions}
            projects={dashboardProjects}
            projectSearchQuery={projectSearchQuery}
            projectStatusFilter={projectStatusFilter}
            onProjectSearchChange={setProjectSearchQuery}
            onProjectStatusFilterChange={setProjectStatusFilter}
            onSelectProject={setSelectedProject}
          />
        )}
      </div>
    </div>
  );
}
