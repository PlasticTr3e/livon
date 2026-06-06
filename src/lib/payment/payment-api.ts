import type { PaymentProject } from "./payment-types";

type ProjectResponse = {
  success?: boolean;
  data?: {
    id: string;
    title: string;
  };
};

type DonationResponse = {
  success?: boolean;
  message?: string;
  data?: {
    token?: string;
  };
};

export function getStoredPaymentToken() {
  return localStorage.getItem("livon-token");
}

export async function fetchPaymentProject(
  projectId: string,
  token?: string | null,
): Promise<PaymentProject | null> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api/projects/${projectId}`, { headers });
  const json = (await response.json()) as ProjectResponse;

  if (!json.success || !json.data) return null;

  return {
    id: json.data.id,
    name: json.data.title,
  };
}

export async function createDonationPayment({
  amount,
  projectId,
  token,
}: {
  amount: number;
  projectId: string;
  token: string;
}) {
  const response = await fetch("/api/donations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      projectId,
      amount,
    }),
  });
  const result = (await response.json()) as DonationResponse;

  if (!response.ok || !result.success || !result.data?.token) {
    throw new Error(result.message || "Failed to process donation.");
  }

  return result.data.token;
}
