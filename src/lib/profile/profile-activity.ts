import type {
  NewsListResponse,
  ProfileActivityItem,
  ProfileActivityType,
  ProjectActivitySource,
} from "./profile-types";

type ActivityRecord = {
  id: string;
  type: string;
  action: string;
  targetTitle: string;
  createdAt: string;
};

export type ProfileActivitySummary = {
  totalVotes: number;
  totalComments: number;
  totalDonations: number;
  totalProjectsMade: number;
  totalNewsMade: number;
  totalVerified: number;
  mostInteractedProject: string;
  maxInteractions: number;
  lastActivityTime: string | null;
};

const activityTypeByApiType: Record<string, ProfileActivityType> = {
  VOTE: "voted",
  COMMENT: "commented",
  DONATION: "donated",
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  NEWS_CREATED: "news_created",
  NEWS_UPDATED: "news_updated",
  WARGA_VERIFIED: "warga_verified",
};

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export function transformToProfileActivity(
  record: ActivityRecord,
): ProfileActivityItem {
  return {
    id: record.id,
    type: activityTypeByApiType[record.type] ?? "voted",
    project: record.targetTitle || "Unknown Target",
    targetTitle: record.targetTitle || "Unknown Target",
    time: formatTimeAgo(record.createdAt),
    createdAt: record.createdAt,
    actionDesc: record.action || "Interacted",
  };
}

export function createAgencyActivities(
  projects: ProjectActivitySource[],
  newsList: NewsListResponse,
  userId: string,
): ProfileActivityItem[] {
  const projectActivities = projects
    .filter((project) => project.agencyId === userId)
    .map((project) =>
      createProfileActivityItem({
        id: `project-created-${project.id}`,
        type: "project_created",
        title: project.title,
        createdAt: project.createdAt,
        actionDesc: "Created a project",
      }),
    );

  const newsActivities = (newsList.items ?? [])
    .filter((item) => item.createdById === userId)
    .map((item) =>
      createProfileActivityItem({
        id: `news-created-${item.id}`,
        type: "news_created",
        title: item.title,
        createdAt: item.createdAt,
        actionDesc: "Published news",
      }),
    );

  return [...projectActivities, ...newsActivities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getProfileActivitySummary(
  activities: ProfileActivityItem[],
): ProfileActivitySummary {
  const projectCounts = activities.reduce<Record<string, number>>(
    (counts, activity) => ({
      ...counts,
      [activity.targetTitle]: (counts[activity.targetTitle] ?? 0) + 1,
    }),
    {},
  );

  const [mostInteractedProject = "", maxInteractions = 0] =
    Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0] ?? [];

  return {
    totalVotes: countActivitiesByType(activities, "voted"),
    totalComments: countActivitiesByType(activities, "commented"),
    totalDonations: countActivitiesByType(activities, "donated"),
    totalProjectsMade: countActivitiesByType(activities, "project_created"),
    totalNewsMade: countActivitiesByType(activities, "news_created"),
    totalVerified: countActivitiesByType(activities, "warga_verified"),
    mostInteractedProject,
    maxInteractions,
    lastActivityTime: activities[0]?.createdAt
      ? formatTimeAgo(activities[0].createdAt)
      : null,
  };
}

function createProfileActivityItem({
  id,
  type,
  title,
  createdAt,
  actionDesc,
}: {
  id: string;
  type: ProfileActivityType;
  title: string;
  createdAt?: string;
  actionDesc: string;
}): ProfileActivityItem {
  const activityDate = createdAt ?? new Date().toISOString();

  return {
    id,
    type,
    project: title,
    targetTitle: title,
    time: formatTimeAgo(activityDate),
    createdAt: activityDate,
    actionDesc,
  };
}

function countActivitiesByType(
  activities: ProfileActivityItem[],
  type: ProfileActivityType,
) {
  return activities.filter((activity) => activity.type === type).length;
}
