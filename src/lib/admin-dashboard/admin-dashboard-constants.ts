import {
  DollarSign,
  FolderGit2,
  MessageCircle,
  MessageSquare,
  Newspaper,
  Users,
} from "lucide-react";

export const EMPTY_DASHBOARD_METRICS = {
  totalWargaAktif: 0,
  totalProyek: 0,
  totalPartisipasi: 0,
  totalDana: 0,
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  USULAN: "Planning",
  DISETUJUI: "Funding",
  BERJALAN: "Construction",
  SELESAI: "Completed",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  Planning: "#3b82f6",
  Funding: "#eab308",
  Construction: "#f97316",
  Completed: "#22c55e",
};

export const ADMIN_DASHBOARD_ACTIONS = [
  {
    icon: FolderGit2,
    label: "Create Project",
    href: "/admin/projects/create",
    color: "text-green-600",
    hover: "hover:bg-gray-50 dark:hover:bg-[#111827]",
    bgIcon: "bg-green-50",
  },
  {
    icon: Newspaper,
    label: "Create News",
    href: "/admin/news/create",
    color: "text-blue-600",
    hover: "hover:bg-gray-50 dark:hover:bg-[#111827]",
    bgIcon: "bg-blue-50",
  },
  {
    icon: DollarSign,
    label: "Check Donations",
    href: "/admin/crowdfunding",
    color: "text-yellow-600",
    hover: "hover:bg-gray-50 dark:hover:bg-[#111827]",
    bgIcon: "bg-yellow-50",
  },
  {
    icon: MessageSquare,
    label: "Moderate Comments",
    href: "/admin/comments",
    color: "text-orange-600",
    hover: "hover:bg-gray-50 dark:hover:bg-[#111827]",
    bgIcon: "bg-orange-50",
  },
  {
    icon: Users,
    label: "Moderate Users",
    href: "/admin/users",
    color: "text-purple-600",
    hover: "hover:bg-gray-50 dark:hover:bg-[#111827]",
    bgIcon: "bg-purple-50",
  },
];

export const ADMIN_DASHBOARD_STAT_STYLES = [
  {
    title: "Total Funds Collected",
    icon: DollarSign,
    wrapperClass: "border-green-100",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    title: "Total Projects",
    icon: FolderGit2,
    wrapperClass: "border-blue-100",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Total Residents",
    icon: Users,
    wrapperClass: "border-purple-100",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    title: "Total Comments",
    icon: MessageCircle,
    wrapperClass: "border-orange-100",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
];
