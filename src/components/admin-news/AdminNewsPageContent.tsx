"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/AppToaster";
import {
  deleteAdminNews,
  fetchAdminNewsItems,
  setAdminNewsHeadline,
} from "@/lib/admin-news/admin-news-api";
import type { AdminNewsWithExtras } from "@/lib/admin-news/admin-news-types";
import { AdminNewsHeader } from "./AdminNewsHeader";
import { AdminNewsTable } from "./AdminNewsTable";

export function AdminNewsPageContent() {
  const router = useRouter();
  const toast = useToast();
  const [news, setNews] = useState<AdminNewsWithExtras[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNews(await fetchAdminNewsItems());
    } catch {
      const errorMessage = "Failed to load news.";
      setError(errorMessage);
      toast.error("Failed to load news", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  function handleEditOpen(item: AdminNewsWithExtras) {
    router.push(`/admin/news/${item.id}`);
  }

  async function handleDelete(newsId: string) {
    if (!window.confirm("Delete this news item?")) return;

    try {
      await deleteAdminNews(newsId);
      await fetchNews();
      toast.success("Success", "News deleted.");
    } catch (err) {
      toast.error(
        "Delete failed",
        err instanceof Error ? err.message : "Failed to delete news.",
      );
    }
  }

  function handleToggleHeadline(newsId: string) {
    setNews((currentNews) => setAdminNewsHeadline(currentNews, newsId));
    toast.success("Saved", "Headline news updated.");
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
      <AdminNewsHeader onCreate={() => router.push("/admin/news/create")} />
      <AdminNewsTable
        error={error}
        isLoading={isLoading}
        news={news}
        onDelete={handleDelete}
        onEdit={handleEditOpen}
        onToggleHeadline={handleToggleHeadline}
      />
    </div>
  );
}
