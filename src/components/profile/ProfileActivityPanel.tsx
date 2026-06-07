import {
  Activity,
  CheckCircle2,
  FileText,
  FolderPlus,
  Heart,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getProfileActivitySummary } from "@/lib/profile/profile-activity";
import type {
  ProfileActivityItem,
  ProfileActivityType,
  ProfileRole,
} from "@/lib/profile/profile-types";
import { ProfileSectionHeader } from "./ProfileSectionHeader";

type ProfileActivityPanelProps = {
  activities: ProfileActivityItem[];
  userRole: ProfileRole;
};

type ActivityConfig = {
  label: string;
  color: string;
  icon: LucideIcon;
};

const activityConfig: Record<ProfileActivityType, ActivityConfig> = {
  voted: {
    label: "Voted on project",
    color: "bg-green-600 text-white",
    icon: ThumbsUp,
  },
  commented: {
    label: "Commented on project",
    color: "bg-yellow-100 text-yellow-800",
    icon: MessageSquare,
  },
  donated: {
    label: "Donated to project",
    color: "bg-green-700 text-white",
    icon: Heart,
  },
  project_created: {
    label: "Created Project",
    color: "bg-blue-600 text-white",
    icon: FolderPlus,
  },
  project_updated: {
    label: "Updated Project",
    color: "bg-blue-100 text-blue-800",
    icon: RefreshCw,
  },
  news_created: {
    label: "Published News",
    color: "bg-purple-600 text-white",
    icon: FileText,
  },
  news_updated: {
    label: "Updated News",
    color: "bg-purple-100 text-purple-800",
    icon: RefreshCw,
  },
  warga_verified: {
    label: "Verified User",
    color: "bg-emerald-100 text-emerald-800",
    icon: UserCheck,
  },
};

export function ProfileActivityPanel({
  activities,
  userRole,
}: ProfileActivityPanelProps) {
  const summary = getProfileActivitySummary(activities);

  return (
    <div className="max-w-xl">
      <ProfileSectionHeader
        title="Recent Activity"
        description="Activity log and interactions on the LIVON platform."
      />

      <ProfileDivider label="Activity Summary" />
      <ActivitySummaryGrid summary={summary} userRole={userRole} />

      {userRole === "resident" &&
        activities.length > 0 &&
        summary.mostInteractedProject && (
          <ProfileInsight className="mb-8" icon={Activity}>
            You care a lot about the project{" "}
            <span className="font-semibold text-gray-900">
              {summary.mostInteractedProject}
            </span>{" "}
            ({summary.maxInteractions} interactions).
          </ProfileInsight>
        )}

      {summary.lastActivityTime && (
        <ProfileInsight className="mb-8" icon={CheckCircle2}>
          Your last activity was recorded on{" "}
          <span className="font-semibold">{summary.lastActivityTime}</span>.
        </ProfileInsight>
      )}

      <ProfileDivider label="Activity History" />
      <ActivityHistoryList activities={activities} />
    </div>
  );
}

function ActivitySummaryGrid({
  summary,
  userRole,
}: {
  summary: ReturnType<typeof getProfileActivitySummary>;
  userRole: ProfileRole;
}) {
  const residentStats = [
    {
      label: "Total Votes",
      value: summary.totalVotes,
      className: "bg-green-50 border-green-200 text-green-700",
    },
    {
      label: "Total Comments",
      value: summary.totalComments,
      className: "bg-yellow-50 border-yellow-200 text-yellow-700",
    },
    {
      label: "Total Donations",
      value: summary.totalDonations,
      className: "bg-blue-50 border-blue-200 text-blue-700",
    },
  ];
  const agencyStats = [
    {
      label: "Projects Created",
      value: summary.totalProjectsMade,
      className: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      label: "News Published",
      value: summary.totalNewsMade,
      className: "bg-purple-50 border-purple-200 text-purple-700",
    },
    {
      label: "Verified Residents",
      value: summary.totalVerified,
      className: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
  ];
  const stats = userRole === "agency" ? agencyStats : residentStats;

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border p-4 text-center ${stat.className}`}
        >
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityHistoryList({
  activities,
}: {
  activities: ProfileActivityItem[];
}) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 dark:text-white">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {activities.map((item) => {
        const config = activityConfig[item.type];
        const Icon = config?.icon || Activity;

        return (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 transition-all hover:border-gray-400 dark:border-gray-800 dark:bg-[#1F2937]"
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${config?.color || "bg-gray-100 text-gray-600"}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                {config?.label || item.actionDesc}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-white">
                {item.targetTitle}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs text-gray-400 dark:text-white">
              {item.time}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProfileDivider({ label }: { label: string }) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-200 dark:border-gray-800" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-slate-50 pr-3 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:bg-[#0B1120]">
          {label}
        </span>
      </div>
    </div>
  );
}

function ProfileInsight({
  children,
  className,
  icon: Icon,
}: {
  children: React.ReactNode;
  className?: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 ${className ?? ""}`}
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  );
}
