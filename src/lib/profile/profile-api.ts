import type { UserWithProfile } from "./profile-types";

type ApiResponse<T> = {
  data?: T | { data?: T };
};

export function getStoredProfileToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchProfileUser(
  token: string,
  signal?: AbortSignal,
): Promise<UserWithProfile | null> {
  const response = await fetch("/api/users/profile", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) return null;

  const json = (await response.json()) as ApiResponse<UserWithProfile>;
  return normalizeApiData(json);
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
  const wantsPasswordChange = Boolean(
    formData.get("newPassword") || formData.get("confirmPassword"),
  );

  // Skip password fields entirely when only profile info is being updated.
  if (!wantsPasswordChange) return {};

  return {
    currentPassword: formData.get("currentPassword") || undefined,
    newPassword: formData.get("newPassword") || undefined,
    confirmPassword: formData.get("confirmPassword") || undefined,
  };
}
