import { apiFetch } from "@/lib/api-client";
import { mapAdminDonationToTransaction } from "@/lib/admin-crowdfunding/admin-crowdfunding-format";
import type {
  AdminCrowdfundingProject,
  AdminCrowdfundingRawDonation,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

export async function fetchAdminCrowdfundingData() {
  const token = localStorage.getItem("livon-token");
  const headers = getAdminCrowdfundingHeaders(token);

  const [projects, transactions] = await Promise.all([
    fetchDetailedAdminCrowdfundingProjects(headers),
    fetchAdminCrowdfundingTransactions(headers),
  ]);

  return { projects, transactions };
}

async function fetchDetailedAdminCrowdfundingProjects(headers: HeadersInit) {
  const response = await apiFetch<AdminCrowdfundingProject[]>("/api/projects", {
    headers,
  });

  if (!response.success || !response.data) return [];

  return Promise.all(
    response.data.map(async (project) => {
      try {
        const detailResponse = await apiFetch<AdminCrowdfundingProject>(
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
}

async function fetchAdminCrowdfundingTransactions(headers: HeadersInit) {
  const response = await apiFetch<AdminCrowdfundingRawDonation[]>(
    "/api/donations",
    { headers },
  );

  if (!response.success || !response.data) return [];

  return response.data.map(mapAdminDonationToTransaction);
}

function getAdminCrowdfundingHeaders(token: string | null) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
