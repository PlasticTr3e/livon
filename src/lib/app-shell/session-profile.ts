import { getUserProfileDisplayName, type UserProfileNameSource } from "./user";

type SessionProfileResponse = {
  data?: UserProfileNameSource | { data?: UserProfileNameSource };
};

export async function fetchSessionDisplayName(token: string) {
  const response = await fetch("/api/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return undefined;

  const json = (await response.json()) as SessionProfileResponse;
  const profile = normalizeSessionProfile(json);
  if (!profile) return undefined;

  const displayName = getUserProfileDisplayName(profile, "");
  return displayName === "User" ? undefined : displayName;
}

function normalizeSessionProfile(json: SessionProfileResponse) {
  const data = json.data;

  if (data && typeof data === "object" && "data" in data) {
    return data.data;
  }

  return data as UserProfileNameSource | undefined;
}
