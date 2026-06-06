"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchNews();
  }, []);

  async function fetchNews() {
    setIsLoading(true);
    setError(null);
    try {
      setNews(await fetchAdminNewsItems());
    } catch {
      setError("Gagal mengambil data berita");
    } finally {
      setIsLoading(false);
    }
  }

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
        alert("Gagal mengunggah gambar berita");
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
    } catch (err) {
      alert(
        err instanceof Error
          ? `Gagal menyimpan perubahan: ${err.message}`
          : "Gagal menyimpan perubahan",
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
        alert("Gagal mengunggah gambar berita");
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
    } catch (err) {
      alert(
        `Gagal membuat berita: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(newsId: string) {
    if (!window.confirm("Hapus berita ini?")) return;

    try {
      await deleteAdminNews(newsId);
      await fetchNews();
    } catch (err) {
      alert(
        err instanceof Error
          ? `Gagal menghapus berita: ${err.message}`
          : "Gagal menghapus berita",
      );
    }
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
          modalTitle="Edit Berita"
          submitLabel="Simpan"
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
          submitLabel="Simpan"
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
          onToggleHeadline={(id) =>
            setNews((currentNews) => setAdminNewsHeadline(currentNews, id))
          }
        />
      </div>
    </>
  );
}
