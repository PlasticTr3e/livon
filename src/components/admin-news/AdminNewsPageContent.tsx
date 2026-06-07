"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/AppToaster";
import {
  createAdminNews,
  deleteAdminNews,
  fetchAdminNewsItems,
  setAdminNewsHeadline,
  updateAdminNews,
} from "@/lib/admin-news/admin-news-api";
import { uploadAdminNewsImage } from "@/lib/admin-news/admin-news-upload";
import type { AdminNewsWithExtras } from "@/lib/admin-news/admin-news-types";
import { AdminNewsFormModal } from "./AdminNewsFormModal";
import { AdminNewsHeader } from "./AdminNewsHeader";
import { AdminNewsTable } from "./AdminNewsTable";

export function AdminNewsPageContent() {
  const toast = useToast();
  const [news, setNews] = useState<AdminNewsWithExtras[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const editingNews = news.find((item) => item.id === editNewsId);

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

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(
    event: React.DragEvent,
    setFile: (file: File | null) => void,
  ) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.[0]) {
      setFile(event.dataTransfer.files[0]);
    }
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      return await uploadAdminNewsImage(file);
    } finally {
      setUploading(false);
    }
  }

  function handleEditOpen(item: AdminNewsWithExtras) {
    setEditNewsId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content || "");
    setEditImage(null);
  }

  async function handleEditSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editNewsId) return;

    let thumbnailUrl = editingNews?.thumbnailUrl || "";
    if (editImage) {
      const uploadedUrl = await uploadImage(editImage);
      if (!uploadedUrl) {
        toast.error("Upload failed", "Failed to upload the news image.");
        return;
      }
      thumbnailUrl = uploadedUrl;
    }

    try {
      await updateAdminNews(editNewsId, {
        title: editTitle,
        content: editContent,
        thumbnailUrl,
      });
      await fetchNews();
      setEditNewsId(null);
      toast.success("Saved", "News changes saved.");
    } catch (err) {
      toast.error(
        "Save failed",
        err instanceof Error ? err.message : "Failed to save changes.",
      );
    }
  }

  async function handleCreateNews(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);

    let thumbnailUrl = "";
    if (newImage) {
      const uploadedUrl = await uploadImage(newImage);
      if (!uploadedUrl) {
        toast.error("Upload failed", "Failed to upload the news image.");
        setCreating(false);
        return;
      }
      thumbnailUrl = uploadedUrl;
    }

    try {
      const createdNews = await createAdminNews({
        title: newTitle,
        content: newContent,
        thumbnailUrl,
      });
      setShowCreate(false);
      setNewTitle("");
      setNewContent("");
      setNewImage(null);
      setNews((prev) => [createdNews, ...prev]);
      toast.success("Success", "News created.");
    } catch (err) {
      toast.error(
        "Create failed",
        err instanceof Error ? err.message : "Unknown error",
      );
    } finally {
      setCreating(false);
    }
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
    <>
      {editNewsId && (
        <AdminNewsFormModal
          content={editContent}
          file={editImage}
          inputId="edit-image-input"
          isDragging={isDragging}
          isSaving={uploading}
          modalTitle="Edit News"
          submitLabel="Save"
          title={editTitle}
          onCancel={() => setEditNewsId(null)}
          onContentChange={setEditContent}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(event) => handleDrop(event, setEditImage)}
          onFileChange={setEditImage}
          onSubmit={handleEditSave}
          onTitleChange={setEditTitle}
        />
      )}

      {showCreate && (
        <AdminNewsFormModal
          content={newContent}
          file={newImage}
          inputId="new-image-input"
          isDragging={isDragging}
          isSaving={creating}
          isUploading={uploading}
          modalTitle="Create News"
          submitLabel="Save"
          title={newTitle}
          onCancel={() => setShowCreate(false)}
          onContentChange={setNewContent}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(event) => handleDrop(event, setNewImage)}
          onFileChange={setNewImage}
          onSubmit={handleCreateNews}
          onTitleChange={setNewTitle}
        />
      )}

      <div className="min-h-full space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
        <AdminNewsHeader onCreate={() => setShowCreate(true)} />
        <AdminNewsTable
          error={error}
          isLoading={isLoading}
          news={news}
          onDelete={handleDelete}
          onEdit={handleEditOpen}
          onToggleHeadline={handleToggleHeadline}
        />
      </div>
    </>
  );
}
