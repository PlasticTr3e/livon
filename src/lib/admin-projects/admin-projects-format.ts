import type {
  AdminProjectStatus,
  AdminProjectStatusConfig,
} from "./admin-projects-types";

export const ADMIN_PROJECT_STATUSES: AdminProjectStatus[] = [
  "USULAN",
  "DISETUJUI",
  "BERJALAN",
  "SELESAI",
];

export const ADMIN_PROJECT_STATUS_CONFIG: Record<
  AdminProjectStatus,
  AdminProjectStatusConfig
> = {
  USULAN: {
    label: "Planning",
    style: "bg-blue-50 text-blue-600 border-blue-100",
    dot: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  DISETUJUI: {
    label: "Funding",
    style: "bg-yellow-50 text-yellow-700 border-yellow-100",
    dot: "bg-yellow-600",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    border: "border-yellow-100",
  },
  BERJALAN: {
    label: "Construction",
    style: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-600",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    border: "border-orange-100",
  },
  SELESAI: {
    label: "Completed",
    style: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-100",
  },
};

export function isAdminProjectStatus(
  value: string,
): value is AdminProjectStatus {
  return value in ADMIN_PROJECT_STATUS_CONFIG;
}

export function getAdminProjectStatusLabel(status: string) {
  return isAdminProjectStatus(status)
    ? ADMIN_PROJECT_STATUS_CONFIG[status].label
    : "Planning";
}

export function formatAdminProjectBudget(value?: number | string | null) {
  return value ? `Rp ${Number(value).toLocaleString("id-ID")}` : "Rp 0";
}

export function formatAdminProjectDate(value?: string | Date | null) {
  return new Date(value || Date.now()).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function roundAdminProjectCoordinate(value: number) {
  return Number(value.toFixed(4));
}
