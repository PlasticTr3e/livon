import { getProjectStage } from "@/lib/project-lifecycle";
import type {
  MapProject,
  MapProjectStatus,
  MapStatusFilter,
} from "./map-types";

export const MAP_STATUS_FILTERS: MapStatusFilter[] = [
  "All",
  "Planning",
  "Under Construction",
  "Completed",
];

export const MAP_LEGEND_ITEMS: { status: MapProjectStatus; label: string }[] = [
  { status: "Planning", label: "Planning" },
  { status: "Under Construction", label: "Under Construction" },
  { status: "Completed", label: "Completed" },
];

export function mapStatusToUI(status: string): MapProjectStatus {
  return getProjectStage(status);
}

export function getMapStatusStyle(status: string) {
  switch (status) {
    case "Planning":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    case "Under Construction":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    case "Completed":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
    default:
      return "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-white";
  }
}

export function getMapProgressColor(status: string) {
  switch (status) {
    case "Planning":
      return "bg-gradient-to-r from-blue-400 to-blue-600";
    case "Under Construction":
      return "bg-gradient-to-r from-orange-400 to-orange-600";
    case "Completed":
      return "bg-gradient-to-r from-green-400 to-green-600";
    default:
      return "bg-gray-400";
  }
}

export function getMapProgressColorValue(status: string) {
  switch (status) {
    case "Planning":
      return "#2563eb";
    case "Under Construction":
      return "#f97316";
    case "Completed":
      return "#16a34a";
    default:
      return "#9ca3af";
  }
}

export function getMapProjectProgress(status: string) {
  switch (getProjectStage(status)) {
    case "Under Construction":
      return 50;
    case "Completed":
      return 100;
    default:
      return 0;
  }
}

export function formatRupiahFull(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function filterMapProjects({
  projects,
  searchQuery,
  status,
}: {
  projects: MapProject[];
  searchQuery: string;
  status: MapStatusFilter;
}) {
  const normalizedSearchQuery = searchQuery.toLowerCase();

  return projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(normalizedSearchQuery) ||
      project.category.toLowerCase().includes(normalizedSearchQuery);
    const matchesStatus = status === "All" || project.status === status;

    return matchesSearch && matchesStatus;
  });
}

export function getMapProjectDuration(project: MapProject) {
  if (project.estimatedDurationDays && project.estimatedDurationDays > 0) {
    if (project.estimatedDurationDays >= 30) {
      const months = Math.floor(project.estimatedDurationDays / 30);
      return `${months} ${months > 1 ? "Months" : "Month"}`;
    }

    return `${project.estimatedDurationDays} ${
      project.estimatedDurationDays > 1 ? "Days" : "Day"
    }`;
  }

  if (!project.startDate || !project.endDate) return "Not specified";

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    return `${Math.floor(diffDays / 30)} Months`;
  }

  return `${diffDays} Days`;
}
