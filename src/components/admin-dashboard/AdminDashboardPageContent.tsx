"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminDashboardHeader } from "@/components/admin-dashboard/AdminDashboardHeader";
import { AdminDashboardLoading } from "@/components/admin-dashboard/AdminDashboardLoading";
import { AdminDashboardMetricCards } from "@/components/admin-dashboard/AdminDashboardMetricCards";
import { AdminDashboardPriorityProjects } from "@/components/admin-dashboard/AdminDashboardPriorityProjects";
import { AdminDashboardQuickActions } from "@/components/admin-dashboard/AdminDashboardQuickActions";
import { AdminDashboardSentimentChart } from "@/components/admin-dashboard/AdminDashboardSentimentChart";
import { AdminDashboardStatusChart } from "@/components/admin-dashboard/AdminDashboardStatusChart";
import { fetchAdminDashboardData } from "@/lib/admin-dashboard/admin-dashboard-api";
import { EMPTY_DASHBOARD_METRICS } from "@/lib/admin-dashboard/admin-dashboard-constants";
import {
  getSentimentChartData,
  sortPriorityProjects,
} from "@/lib/admin-dashboard/admin-dashboard-format";
import type {
  AdminDashboardMetrics,
  AdminDashboardProject,
  AdminDashboardSortMode,
  ProjectStatusChartItem,
} from "@/lib/admin-dashboard/admin-dashboard-types";

export function AdminDashboardPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<AdminDashboardSortMode>("viral");
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(
    EMPTY_DASHBOARD_METRICS,
  );
  const [projectStatusData, setProjectStatusData] = useState<
    ProjectStatusChartItem[]
  >([]);
  const [priorityProjects, setPriorityProjects] = useState<
    AdminDashboardProject[]
  >([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const dashboardData = await fetchAdminDashboardData();

        if (!isMounted) {
          return;
        }

        setMetrics(dashboardData.metrics);
        setProjectStatusData(dashboardData.projectStatusData);
        setPriorityProjects(dashboardData.priorityProjects);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedPriorityProjects = useMemo(
    () => sortPriorityProjects(priorityProjects, sortBy),
    [priorityProjects, sortBy],
  );
  const sentimentChartData = useMemo(
    () => getSentimentChartData(sortedPriorityProjects),
    [sortedPriorityProjects],
  );

  if (isLoading) {
    return <AdminDashboardLoading />;
  }

  return (
    <div className="flex min-h-full w-full flex-col space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
      <AdminDashboardHeader />
      <AdminDashboardMetricCards metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminDashboardSentimentChart data={sentimentChartData} />
        <AdminDashboardStatusChart data={projectStatusData} metrics={metrics} />
      </div>

      <AdminDashboardPriorityProjects
        projects={sortedPriorityProjects}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <AdminDashboardQuickActions />
    </div>
  );
}
