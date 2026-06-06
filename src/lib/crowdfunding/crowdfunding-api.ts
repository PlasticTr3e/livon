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

  const detailedProjects = await Promise.all(
    response.data.map(async (project) => {
      try {
        const detailResponse = await apiFetch<CrowdfundingProject>(
          `/api/projects/${project.id}`,
          { headers },
        );

        if (detailResponse.success && detailResponse.data) {
          return { ...project, ...detailResponse.data };
        }
      } catch (error) {
        console.error(
          `Failed to fetch details for project ${project.id}:`,
          error,
        );
      }

      return project;
    }),
  );

  return detailedProjects;
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
