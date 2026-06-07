import { apiFetch, apiFetchJson } from "@/lib/api-client";
import type {
  AdminNewsFormValues,
  AdminNewsItem,
  AdminNewsWithExtras,
} from "./admin-news-types";

type AdminNewsListResponse = {
  items?: AdminNewsItem[];
};

export async function fetchAdminNewsItems() {
  const response = await fetch("/api/news?page=1&limit=20");
  if (!response.ok) throw new Error("Failed to load news.");

  const data = await response.json();
  const headlineId =
    typeof window !== "undefined"
      ? localStorage.getItem("headline-news-id")
      : null;
  const newsData = (data.data || {}) as AdminNewsListResponse;

  return (newsData.items || []).map((item) => ({
    ...item,
    isHeadline: item.id === headlineId,
  }));
}

export async function createAdminNews(values: AdminNewsFormValues) {
  const token = localStorage.getItem("livon-token");
  const response = await fetch("/api/news", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || response.statusText);
  }

  const data = await response.json();
  return data.data as AdminNewsWithExtras;
}

export async function updateAdminNews(
  newsId: string,
  values: AdminNewsFormValues,
) {
  const token = localStorage.getItem("livon-token");
  const result = await apiFetchJson(`/api/news/${newsId}`, "PUT", values, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!result.success) {
    throw new Error(result.message || "Failed to save changes.");
  }
}

export async function deleteAdminNews(newsId: string) {
  const token = localStorage.getItem("livon-token");
  const result = await apiFetch(`/api/news/${newsId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!result.success) {
    throw new Error(result.message || "Failed to delete news.");
  }
}

export function setAdminNewsHeadline(
  newsItems: AdminNewsWithExtras[],
  newsId: string,
) {
  if (typeof window !== "undefined") {
    localStorage.setItem("headline-news-id", newsId);
  }

  return newsItems.map((newsItem) => ({
    ...newsItem,
    isHeadline: newsItem.id === newsId,
  }));
}
