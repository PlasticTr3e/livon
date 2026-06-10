import type {
  AdminCommentApiItem,
  AdminCommentItem,
  AdminCommentProject,
  AdminCommentProjectApiItem,
  AdminCommentProjectSort,
  AdminCommentProjectSummary,
  AdminCommentRole,
  AdminCommentsInsight,
  AdminCommentSelectedProject,
  AdminCommentSentiment,
  AdminCommentSentimentFilter,
} from "@/lib/admin-comments/admin-comments-types";
import { getUserProfileDisplayName } from "@/lib/app-shell/user";

const POSITIVE_WORDS = [
  "bagus",
  "setuju",
  "mendukung",
  "alhamdulillah",
  "terima kasih",
  "bermanfaat",
  "selesai",
  "jernih",
  "hebat",
  "mantap",
];

const NEGATIVE_WORDS = [
  "berbahaya",
  "hilang",
  "rusak",
  "masalah",
  "kecewa",
  "tidak",
  "waste",
  "dangerous",
  "jelek",
];

export function formatAdminCommentDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatAdminCommentDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminCommentTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function analyzeAdminCommentSentiment(
  text: string,
  score?: number,
): AdminCommentSentiment {
  if (score !== null && score !== undefined) {
    if (score > 0.5) return "Positive";
    if (score < -0.5) return "Negative";
    return "Neutral";
  }

  const normalizedText = text.toLowerCase();

  if (POSITIVE_WORDS.some((word) => normalizedText.includes(word))) {
    return "Positive";
  }

  if (NEGATIVE_WORDS.some((word) => normalizedText.includes(word))) {
    return "Negative";
  }

  return "Neutral";
}

export function getAdminCommentSentimentReason(
  sentiment: AdminCommentSentiment,
) {
  switch (sentiment) {
    case "Positive":
      return "Komentar ini mengandung apresiasi atau dukungan yang membangun atmosfer positif bagi komunitas.";
    case "Negative":
      return "Komentar ini terdeteksi mengandung keluhan atau sentimen negatif yang mungkin perlu ditinjau lebih lanjut.";
    default:
      return "Komentar ini bersifat informatif atau berisi pernyataan umum tanpa indikasi emosi yang kuat.";
  }
}

export function getAdminCommentSentimentClass(
  sentiment: AdminCommentSentiment,
) {
  switch (sentiment) {
    case "Positive":
      return "bg-green-100 text-green-700 border-green-300";
    case "Negative":
      return "bg-red-100 text-red-600 border-red-300";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

export function getAdminCommentRoleClass(role: AdminCommentRole) {
  return role === "agency"
    ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
    : "bg-green-100 text-green-700 border-2 border-green-300";
}

export function mapAdminCommentRole(role: string): AdminCommentRole {
  const normalizedRole = role.toUpperCase();
  return normalizedRole.includes("WARGA") || normalizedRole.includes("RESIDENT")
    ? "resident"
    : "agency";
}

export function mapAdminCommentProject(
  project: AdminCommentProjectApiItem,
): AdminCommentProject {
  return {
    id: project.id,
    title: project.title || project.name || "Untitled Project",
    createdAt: project.createdAt,
  };
}

export function mapAdminComment(
  comment: AdminCommentApiItem,
): AdminCommentItem {
  const sentiment = analyzeAdminCommentSentiment(
    comment.text,
    comment.sentimentScore,
  );

  return {
    id: comment.id,
    author: getUserProfileDisplayName(comment.user, "Unknown User"),
    text: comment.text || "",
    role: mapAdminCommentRole(comment.user?.role || "WARGA"),
    projectName: comment.project?.title || comment.news?.title || "News",
    projectId: comment.projectId || null,
    flag: comment.sentimentLabel === "NEGATIF" || sentiment === "Negative",
    userId: comment.userId,
    createdAt: comment.createdAt,
    sentiment,
  };
}

export function getAdminCommentsInsight(
  comments: AdminCommentItem[],
): AdminCommentsInsight {
  const positiveComments = comments.filter(
    (comment) => comment.sentiment === "Positive",
  ).length;
  const flaggedComments = comments.filter((comment) => comment.flag).length;

  return {
    total: comments.length,
    flagged: flaggedComments,
    positiveRate:
      comments.length > 0
        ? Math.round((positiveComments / comments.length) * 100)
        : 0,
    toxicityRate:
      comments.length > 0
        ? Math.round((flaggedComments / comments.length) * 100)
        : 0,
  };
}

export function getAdminCommentProjectSummaries(
  comments: AdminCommentItem[],
  projects: AdminCommentProject[],
): AdminCommentProjectSummary[] {
  const newsSummary = comments.some((comment) => !comment.projectId)
    ? [
        {
          id: null,
          name: "News",
          firstCommentDate:
            comments.find((comment) => !comment.projectId)?.createdAt ||
            new Date().toISOString(),
        },
      ]
    : [];

  return [
    ...newsSummary,
    ...projects.map((project) => ({
      id: project.id,
      name: project.title,
      firstCommentDate: project.createdAt,
    })),
  ].map((project) => {
    const projectComments = comments.filter(
      (comment) => comment.projectId === project.id,
    );

    return {
      ...project,
      count: projectComments.length,
      flaggedCount: projectComments.filter((comment) => comment.flag).length,
      positiveCount: projectComments.filter(
        (comment) => comment.sentiment === "Positive",
      ).length,
      negativeCount: projectComments.filter(
        (comment) => comment.sentiment === "Negative",
      ).length,
      latestCommentDate:
        projectComments.length > 0
          ? getLatestCommentDate(projectComments)
          : project.firstCommentDate,
    };
  });
}

export function filterAndSortAdminCommentProjects(
  projects: AdminCommentProjectSummary[],
  searchQuery: string,
  sort: AdminCommentProjectSort,
) {
  const normalizedQuery = searchQuery.toLowerCase();

  return projects
    .filter((project) => {
      const matchesSearch = project.name
        .toLowerCase()
        .includes(normalizedQuery);
      if (!matchesSearch) return false;
      if (sort === "positive") return project.positiveCount > 0;
      if (sort === "negative") return project.negativeCount > 0;
      return true;
    })
    .sort((firstProject, secondProject) => {
      const firstDate =
        firstProject.latestCommentDate || new Date(0).toISOString();
      const secondDate =
        secondProject.latestCommentDate || new Date(0).toISOString();

      if (sort === "oldest") return firstDate.localeCompare(secondDate);
      if (sort === "positive") {
        return secondProject.positiveCount - firstProject.positiveCount;
      }
      if (sort === "negative") {
        return secondProject.negativeCount - firstProject.negativeCount;
      }

      return secondDate.localeCompare(firstDate);
    });
}

export function filterAdminComments(
  comments: AdminCommentItem[],
  selectedProject: AdminCommentSelectedProject | null,
  searchQuery: string,
  sentimentFilter: AdminCommentSentimentFilter,
) {
  const normalizedQuery = searchQuery.toLowerCase();

  return comments.filter((comment) => {
    if (selectedProject && comment.projectId !== selectedProject.id) {
      return false;
    }

    const matchesSearch =
      comment.author.toLowerCase().includes(normalizedQuery) ||
      comment.text.toLowerCase().includes(normalizedQuery) ||
      comment.projectName.toLowerCase().includes(normalizedQuery);

    if (!matchesSearch) return false;
    if (sentimentFilter === "all") return true;
    if (sentimentFilter === "flagged") return comment.flag;

    return comment.sentiment === sentimentFilter;
  });
}

export function getAdminCommentNeutralCount(
  project: AdminCommentProjectSummary,
) {
  return Math.max(
    project.count - project.positiveCount - project.negativeCount,
    0,
  );
}

export function getAdminCommentSentimentWidth(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0;
}

function getLatestCommentDate(comments: AdminCommentItem[]) {
  return comments.reduce(
    (latestDate, comment) =>
      comment.createdAt > latestDate ? comment.createdAt : latestDate,
    comments[0].createdAt,
  );
}
