import { apiFetch } from "@/lib/api-client";
import type { CrowdfundingProject } from "./crowdfunding-types";

export function getStoredCrowdfundingToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchCrowdfundingProjects(token: string | null) {
  const headers = getAuthorizedHeaders(token);
  const response = await apiFetch<CrowdfundingProject[]>("/api/projects", {
    headers,
  });

  if (!response.success || !response.data) return [];

  return response.data;
}

export async function fetchCrowdfundingProject(
  projectId: string,
  token: string | null,
) {
  const response = await apiFetch<CrowdfundingProject>(
    `/api/projects/${projectId}`,
    {
      headers: getAuthorizedHeaders(token),
    },
  );

  if (!response.success || !response.data) return null;

  return response.data;
}

function getAuthorizedHeaders(token: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
