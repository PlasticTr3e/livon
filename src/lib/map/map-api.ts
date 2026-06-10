import {
  getMapProjectProgress,
  getVoteDelta,
  mapStatusToUI,
} from "./map-format";
import { getUserProfileDisplayName } from "@/lib/app-shell/user";
import type {
  ActivityFeedItem,
  MapComment,
  MapProject,
  MapVoteAction,
  MapVoteChoice,
} from "./map-types";

type ApiMapComment = {
  id: string | number;
  text?: string;
  createdAt?: string;
  user?: {
    email?: string;
    name?: string | null;
    citizenProfile?: { fullName?: string | null } | null;
    agencyProfile?: { agencyName?: string | null } | null;
  };
};

type ApiProjectListItem = {
  id: string;
};

type ApiProjectDetail = {
  id: string;
  title: string;
  status: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  category?: { name?: string | null } | null;
  budgetTarget?: number | string | null;
  currentFunding?: number | string | null;
  _count?: { votes?: number };
  imageUrls?: string[];
  imageUrl?: string | string[];
  images?: { url?: string | null }[];
  startDate?: string;
  endDate?: string;
  estimatedDurationDays?: number | string | null;
};

const fallbackProjectImage =
  "https://images.unsplash.com/photo-1541888009623-fb944e8bc1a8?q=80&w=400&auto=format&fit=crop";

export function getStoredMapToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchMapProjects(
  token: string | null,
): Promise<MapProject[]> {
  const headers = getAuthorizedHeaders(token);
  const response = await fetch("/api/projects", { headers });
  if (!response.ok) throw new Error("Failed to fetch projects");

  const json = await response.json();
  const projects = (json.data ?? []) as ApiProjectListItem[];
  const fullProjects = await Promise.all(
    projects.map((project) => fetchMapProject(project.id, headers)),
  );

  return fullProjects.filter((project): project is MapProject =>
    Boolean(project),
  );
}

export async function fetchCurrentUserVotes(token: string | null) {
  if (!token) return {};

  const response = await fetch("/api/users/activity?limit=1000", {
    headers: getAuthorizedHeaders(token),
  });
  const json = await response.json();
  const activityItems: ActivityFeedItem[] = Array.isArray(json.data?.data)
    ? json.data.data
    : Array.isArray(json.data)
      ? json.data
      : [];

  return activityItems.reduce<Record<string, MapVoteChoice>>((acc, item) => {
    if (item.type !== "VOTE" || !item.targetId) return acc;
    if (item.action?.toLowerCase().startsWith("upvoted")) {
      acc[item.targetId] = "agree";
    } else if (item.action?.toLowerCase().startsWith("downvoted")) {
      acc[item.targetId] = "disagree";
    }
    return acc;
  }, {});
}

export async function submitMapProjectVote({
  currentVote,
  projectId,
  token,
  voteType,
}: {
  currentVote?: MapVoteChoice;
  projectId: string;
  token: string;
  voteType: MapVoteChoice;
}) {
  const response = await fetch("/api/votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      projectId,
      type: voteType === "agree" ? "UPVOTE" : "DOWNVOTE",
    }),
  });

  const responseData = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Gagal menyimpan vote");

  const action = getVoteAction(response.status, responseData?.action, {
    currentVote,
    voteType,
  });

  return getVoteDelta(action, voteType, currentVote);
}

async function fetchMapProject(
  projectId: string,
  headers: Record<string, string>,
): Promise<MapProject | null> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, { headers });
    const json = await response.json();
    const detail = json.data as ApiProjectDetail | undefined;
    if (!detail) return null;

    return {
      id: detail.id,
      name: detail.title,
      address: getProjectAddress(detail),
      category: detail.category?.name || "Uncategorized",
      status: mapStatusToUI(detail.status),
      progress: getMapProjectProgress(detail.status),
      budget: Number(detail.budgetTarget) || 0,
      fundsCollected: Number(detail.currentFunding) || 0,
      votes: { agree: detail._count?.votes || 0, disagree: 0 },
      comments: await fetchMapProjectComments(detail.id, headers),
      lat: detail.latitude,
      lng: detail.longitude,
      imageUrl: getProjectImageUrl(detail),
      startDate: detail.startDate,
      endDate: detail.endDate,
      estimatedDurationDays: detail.estimatedDurationDays
        ? Number(detail.estimatedDurationDays)
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching project details", error);
    return null;
  }
}

async function fetchMapProjectComments(
  projectId: string,
  headers: Record<string, string>,
): Promise<MapComment[]> {
  try {
    const response = await fetch(`/api/comments?projectId=${projectId}`, {
      headers,
    });
    const json = await response.json();
    const comments = Array.isArray(json.data)
      ? (json.data as ApiMapComment[])
      : [];

    return comments.map((comment) => ({
      id: String(comment.id),
      author: getUserProfileDisplayName(comment.user, "Resident"),
      text: comment.text || "",
      timestamp: comment.createdAt
        ? new Date(comment.createdAt).toLocaleDateString()
        : "-",
    }));
  } catch (error) {
    console.error("Failed to fetch comments for map", error);
    return [];
  }
}

function getAuthorizedHeaders(token: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function getProjectAddress(project: ApiProjectDetail) {
  const hasCoordinates =
    typeof project.latitude === "number" &&
    typeof project.longitude === "number" &&
    !Number.isNaN(project.latitude) &&
    !Number.isNaN(project.longitude);

  if (hasCoordinates) {
    return `${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}`;
  }

  return project.address || "-";
}

function getProjectImageUrl(project: ApiProjectDetail) {
  if (Array.isArray(project.imageUrls) && project.imageUrls.length > 0) {
    return project.imageUrls[0];
  }

  if (Array.isArray(project.imageUrl) && project.imageUrl.length > 0) {
    return project.imageUrl[0];
  }

  if (typeof project.imageUrl === "string" && project.imageUrl) {
    return project.imageUrl;
  }

  return project.images?.[0]?.url || fallbackProjectImage;
}

function getVoteAction(
  status: number,
  apiAction: unknown,
  {
    currentVote,
    voteType,
  }: {
    currentVote?: MapVoteChoice;
    voteType: MapVoteChoice;
  },
): MapVoteAction {
  if (["CREATED", "UPDATED", "DELETED"].includes(String(apiAction))) {
    return apiAction as MapVoteAction;
  }

  if (status === 201) return "CREATED";
  if (currentVote === voteType) return "DELETED";
  if (currentVote) return "UPDATED";
  return "CREATED";
}
