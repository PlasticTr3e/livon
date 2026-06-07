import {
  EMPTY_DASHBOARD_METRICS,
  PROJECT_STATUS_LABELS,
} from "@/lib/admin-dashboard/admin-dashboard-constants";
import type {
  AdminDashboardMetrics,
  AdminDashboardProject,
  AdminDashboardSortMode,
  DominantSentiment,
  ProjectSentimentChartItem,
  ProjectStatusChartItem,
  SentimentDistribution,
} from "@/lib/admin-dashboard/admin-dashboard-types";

export function getProjectStatusLabel(status?: string) {
  return PROJECT_STATUS_LABELS[status?.toUpperCase() || "USULAN"] || "Planning";
}

export function getProjectStatusBadgeClass(status?: string) {
  switch (status?.toUpperCase()) {
    case "DISETUJUI":
      return "bg-yellow-50 text-yellow-700";
    case "BERJALAN":
      return "bg-orange-50 text-orange-700";
    case "SELESAI":
      return "bg-green-50 text-green-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function formatDashboardStats(metrics: AdminDashboardMetrics) {
  return [
    `Rp ${metrics.totalDana.toLocaleString("id-ID")}`,
    metrics.totalProyek.toString(),
    metrics.totalWargaAktif.toString(),
    metrics.totalPartisipasi.toString(),
  ];
}

export function getProjectStatusChartData(
  projects: AdminDashboardProject[],
): ProjectStatusChartItem[] {
  const statusCounts = projects.reduce<Record<string, number>>(
    (acc, project) => {
      const statusLabel = getProjectStatusLabel(project.status);
      acc[statusLabel] = (acc[statusLabel] || 0) + 1;
      return acc;
    },
    {},
  );

  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
}

export function getPriorityProjectTotalVotes(
  projects: AdminDashboardProject[],
) {
  return projects.reduce((sum, project) => sum + (project.totalVotes || 0), 0);
}

export function getProjectsTotalFunding(projects: AdminDashboardProject[]) {
  return projects.reduce(
    (sum, project) => sum + Number(project.currentFunding || 0),
    0,
  );
}

export function mergeDashboardMetrics(
  incomingMetrics: Partial<AdminDashboardMetrics> | undefined,
  projects: AdminDashboardProject[],
  priorityProjects: AdminDashboardProject[],
): AdminDashboardMetrics {
  const metrics = {
    ...EMPTY_DASHBOARD_METRICS,
    ...(incomingMetrics ?? {}),
  };

  if (metrics.totalProyek === 0) {
    metrics.totalProyek = projects.length;
  }

  if (metrics.totalPartisipasi === 0) {
    metrics.totalPartisipasi = getPriorityProjectTotalVotes(priorityProjects);
  }

  return metrics;
}

export function sortPriorityProjects(
  projects: AdminDashboardProject[],
  sortBy: AdminDashboardSortMode,
) {
  return [...projects]
    .sort((firstProject, secondProject) => {
      if (sortBy === "viral") {
        return (secondProject.totalVotes || 0) - (firstProject.totalVotes || 0);
      }

      const firstPositive =
        firstProject.sentimentAnalytics?.distribution?.positive || 0;
      const secondPositive =
        secondProject.sentimentAnalytics?.distribution?.positive || 0;

      if (secondPositive !== firstPositive) {
        return secondPositive - firstPositive;
      }

      return (
        (secondProject.sentimentAnalytics?.averageScore || 0) -
        (firstProject.sentimentAnalytics?.averageScore || 0)
      );
    })
    .slice(0, 10);
}

export function getSentimentChartData(
  projects: AdminDashboardProject[],
): ProjectSentimentChartItem[] {
  return projects.slice(0, 5).map((project) => ({
    name:
      project.title.length > 12
        ? `${project.title.substring(0, 12)}...`
        : project.title,
    fullName: project.title,
    Positive: project.sentimentAnalytics?.distribution?.positive || 0,
    Neutral: project.sentimentAnalytics?.distribution?.neutral || 0,
    Negative: project.sentimentAnalytics?.distribution?.negative || 0,
  }));
}

export function getDominantSentiment(
  distribution?: SentimentDistribution,
): DominantSentiment {
  if (!distribution) {
    return getEmptySentiment();
  }

  const { positive, negative, neutral } = distribution;
  const total = positive + negative + neutral;

  if (total === 0) {
    return getEmptySentiment();
  }

  if (positive >= negative && positive >= neutral) {
    return {
      label: "Positive",
      color: "bg-green-50 text-green-700",
      percentage: Math.round((positive / total) * 100),
    };
  }

  if (negative > positive && negative > neutral) {
    return {
      label: "Negative",
      color: "bg-red-50 text-red-700",
      percentage: Math.round((negative / total) * 100),
    };
  }

  return {
    label: "Neutral",
    color: "bg-gray-100 text-gray-700 dark:text-white",
    percentage: Math.round((neutral / total) * 100),
  };
}

function getEmptySentiment(): DominantSentiment {
  return {
    label: "None",
    color: "bg-gray-100 text-gray-500 dark:text-white",
    percentage: 0,
  };
}
