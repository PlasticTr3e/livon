import {
  createAgencyActivities,
  transformToProfileActivity,
} from "./profile-activity";
import type {
  NewsListResponse,
  ProfileActivityItem,
  ProjectActivitySource,
  UserWithProfile,
} from "./profile-types";

type ApiResponse<T> = {
  data?: T | { data?: T };
};

export function getStoredProfileToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchProfileUser(
  token: string,
): Promise<UserWithProfile | null> {
  const response = await fetch("/api/users/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const json = (await response.json()) as ApiResponse<UserWithProfile>;
  return normalizeApiData(json);
}

export async function fetchProfileActivities(
  user: UserWithProfile,
  token: string,
): Promise<ProfileActivityItem[]> {
  if (user.role !== "WARGA") {
    return fetchAgencyActivities(user.id, token);
  }

  return fetchResidentActivities(token);
}

export async function updateProfileUser(
  user: UserWithProfile,
  formData: FormData,
  token: string,
): Promise<Partial<UserWithProfile> | null> {
  const response = await fetch("/api/users/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(getProfileUpdateBody(user, formData)),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.message || "Failed to save personal information");
  }

  const json = (await response.json()) as ApiResponse<Partial<UserWithProfile>>;
  return normalizeApiData(json);
}

function normalizeApiData<T>(json: ApiResponse<T>): T | null {
  const data = json.data;

  if (data && typeof data === "object" && "data" in data) {
    return (data as { data?: T }).data ?? null;
  }

  return (data as T | undefined) ?? null;
}

async function fetchAgencyActivities(userId: string, token: string) {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [projectsResponse, newsResponse] = await Promise.all([
      fetch("/api/projects", { headers }),
      fetch("/api/news?page=1&limit=20", { headers }),
    ]);

    const [projectsJson, newsJson] = await Promise.all([
      projectsResponse.ok ? projectsResponse.json() : Promise.resolve(null),
      newsResponse.ok ? newsResponse.json() : Promise.resolve(null),
    ]);

    const projects = (projectsJson?.data ?? []) as ProjectActivitySource[];
    const newsList = (newsJson?.data ?? {}) as NewsListResponse;

    return createAgencyActivities(projects, newsList, userId);
  } catch (error) {
    console.error("Error fetching agency activities:", error);
    return [];
  }
}

async function fetchResidentActivities(token: string) {
  try {
    const response = await fetch("/api/users/activity", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return [];

    const json = await response.json();
    if (!json.success || !json.data) return [];

    return json.data.slice(0, 20).map(transformToProfileActivity);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

function getProfileUpdateBody(user: UserWithProfile, formData: FormData) {
  const passwordFields = getPasswordUpdateBody(formData);

  if (user.role !== "WARGA") {
    return {
      phone: formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      ...passwordFields,
    };
  }

  return {
    fullName: formData.get("fullName") || undefined,
    phone: formData.get("phone") || undefined,
    blockHouse: formData.get("blokRumah") || undefined,
    houseNumber: formData.get("noRumah") || undefined,
    ...passwordFields,
  };
}

function getPasswordUpdateBody(formData: FormData) {
  return {
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || undefined,
    confirmPassword: formData.get("confirmPassword") || undefined,
  };
}
