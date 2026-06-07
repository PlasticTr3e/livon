import { apiFetch } from "@/lib/api-client";
import {
  getProjectStatusChartData,
  getProjectsTotalFunding,
  mergeDashboardMetrics,
} from "@/lib/admin-dashboard/admin-dashboard-format";
import type {
  AdminDashboardMetrics,
  AdminDashboardProject,
} from "@/lib/admin-dashboard/admin-dashboard-types";

export async function fetchAdminDashboardData() {
  const token = localStorage.getItem("livon-token");
  const headers = { Authorization: `Bearer ${token}` };

  const [metricResponse, projectsResponse, priorityResponse] =
    await Promise.all([
      apiFetch<Partial<AdminDashboardMetrics>>("/api/agency/dashboard", {
        headers,
      }),
      apiFetch<AdminDashboardProject[]>("/api/projects", { headers }),
      apiFetch<AdminDashboardProject[]>("/api/projects/priority", { headers }),
    ]);

  const projects =
    projectsResponse.success && projectsResponse.data
      ? projectsResponse.data
      : [];
  const priorityProjects =
    priorityResponse.success && priorityResponse.data
      ? priorityResponse.data
      : [];

  const metrics = mergeDashboardMetrics(
    metricResponse.success ? metricResponse.data : undefined,
    projects,
    priorityProjects,
  );

  if (metrics.totalDana === 0 && projects.length > 0) {
    metrics.totalDana = await fetchProjectsTotalFunding(projects, headers);
  }

  return {
    metrics,
    priorityProjects,
    projectStatusData: getProjectStatusChartData(projects),
  };
}

async function fetchProjectsTotalFunding(
  projects: AdminDashboardProject[],
  headers: HeadersInit,
) {
  const detailedProjects = await Promise.all(
    projects.map(async (project) => {
      try {
        const detailResponse = await apiFetch<AdminDashboardProject>(
          `/api/projects/${project.id}`,
          { headers },
        );

        return detailResponse.success && detailResponse.data
          ? { ...project, ...detailResponse.data }
          : project;
      } catch {
        return project;
      }
    }),
  );

  return getProjectsTotalFunding(detailedProjects);
}
