"use client";

import {
  Card,
  Button,
  Badge,
  Input,
  cn,
} from "@/components/ui/WireframePrimitives";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  createdById: string;
  author?: {
    agencyProfile?: {
      agencyName?: string;
    };
  };
}

type NewsWithExtras = NewsItem & { isHeadline?: boolean };

function getNewsBucketName() {
  return process.env.NODE_ENV === "production"
    ? "livon-media-prod"
    : "livon-media-dev";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function NewsManagementPage() {
  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (
    e: React.DragEvent,
    setFile: (file: File | null) => void,
  ) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Open edit modal and fill fields
  function handleEditOpen(item: NewsWithExtras) {
    setEditNewsId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content || "");
    setEditImage(null);
  }

  // Save edit (with real image upload)
  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    let thumbnailUrl =
      news.find((n) => n.id === editNewsId)?.thumbnailUrl || "";
    if (editImage) {
      const url = await handleUploadImage(editImage);
      if (!url) {
        alert("Gagal mengunggah gambar berita");
        return;
      }
      thumbnailUrl = url;
    }
    try {
      if (!editNewsId) return;
      const token = localStorage.getItem("livon-token");
      const result = await apiFetchJson(
        `/api/news/${editNewsId}`,
        "PUT",
        {
          title: editTitle,
          content: editContent,
          thumbnailUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (result.success) {
        await fetchNews();
        setEditNewsId(null);
      } else {
        alert("Gagal menyimpan perubahan: " + result.message);
      }
    } catch {
      alert("Gagal menyimpan perubahan");
    }
  }

  // Delete (calls backend and refetches)
  async function handleDelete(id: string) {
    if (!window.confirm("Hapus berita ini?")) return;
    try {
      const token = localStorage.getItem("livon-token");
      const result = await apiFetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (result.success) {
        await fetchNews();
      } else {
        alert("Gagal menghapus berita: " + result.message);
      }
    } catch {
      alert("Gagal menghapus berita");
    }
  }
  const [news, setNews] = useState<NewsWithExtras[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch news (hoisted for reuse)
  async function fetchNews() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news?page=1&limit=20");
      if (res.ok) {
        const data = await res.json();
        const headlineId =
          typeof window !== "undefined"
            ? localStorage.getItem("headline-news-id")
            : null;
        setNews(
          (data.data?.items || []).map((item: NewsItem) => ({
            ...item,
            isHeadline: item.id === headlineId,
          })),
        );
      } else {
        setError("Gagal mengambil data berita");
      }
    } catch {
      setError("Gagal mengambil data berita");
    }
    setLoading(false);
  }
  useEffect(() => {
    fetchNews();
  }, []);

  async function handleUploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const bucketName = getNewsBucketName();

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`uploads/${fileName}`, file, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`uploads/${fileName}`);

        return publicUrl;
      }

      console.warn(
        "Supabase storage upload failed, falling back to data URL",
        uploadError,
      );
      return await readFileAsDataUrl(file);
    } catch (error) {
      console.warn(
        "Client-side image upload failed, falling back to data URL",
        error,
      );
      try {
        return await readFileAsDataUrl(file);
      } catch {
        return null;
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateNews(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    let thumbnailUrl = "";
    if (newImage) {
      const url = await handleUploadImage(newImage);
      if (!url) {
        alert("Gagal mengunggah gambar berita");
        setCreating(false);
        return;
      }
      thumbnailUrl = url;
    }
    try {
      const token = localStorage.getItem("livon-token");
      const res = await fetch("/api/news", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          thumbnailUrl,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewTitle("");
        setNewContent("");
        setNewImage(null);
        // Refresh news
        const data = await res.json();
        setNews((prev) => [data.data, ...prev]);
      } else {
        const data = await res.json().catch(() => null);
        alert(`Gagal membuat berita: ${data?.message || res.statusText}`);
      }
    } catch (error) {
      alert(
        `Gagal membuat berita: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
    setCreating(false);
  }

  function handleToggleHeadline(id: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("headline-news-id", id);
    }
    setNews((prev: NewsWithExtras[]) =>
      prev.map((n: NewsWithExtras) =>
        n.id === id ? { ...n, isHeadline: true } : { ...n, isHeadline: false },
      ),
    );
  }

  return (
    <>
      {/* Edit Modal */}
      {editNewsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-[#111827] rounded-xl p-8 w-full max-w-lg shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              onClick={() => setEditNewsId(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Berita</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Judul Artikel
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  minLength={5}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm p-3"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Thumbnail Upload
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, setEditImage)}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragging
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-200 dark:border-gray-800",
                  )}
                  onClick={() =>
                    document.getElementById("edit-image-input")?.click()
                  }
                >
                  <input
                    id="edit-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-white font-semibold">
                    {editImage
                      ? editImage.name
                      : "Klik atau Drag & Drop gambar di sini"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditNewsId(null)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-[#0B1120] min-h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              News Management
            </h1>
            <p className="text-gray-500 dark:text-white text-sm mt-0.5">
              Publish community announcements and updates.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-sm h-11 px-6 rounded-xl font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New News</span>
          </Button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
            <div className="bg-white dark:bg-[#111827] rounded-xl p-8 w-full max-w-lg shadow-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold mb-4">Create News</h2>
              <form onSubmit={handleCreateNews} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    News Title
                  </label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    minLength={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Isi Konten
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm p-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Thumbnail / Gambar
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, setNewImage)}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragging
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-800",
                    )}
                    onClick={() =>
                      document.getElementById("new-image-input")?.click()
                    }
                  >
                    <input
                      id="new-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-white font-semibold">
                      {newImage
                        ? newImage.name
                        : "Klik atau Drag & Drop gambar di sini"}
                    </p>
                    {uploading && (
                      <p className="mt-2 text-xs text-green-500 animate-pulse">
                        Mengunggah...
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="submit"
                    disabled={creating || uploading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {creating ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Card className="p-5 border-green-100 dark:border-gray-800 shadow-sm">
          {loading ? (
            <div className="text-center text-gray-400 py-10">
              Memuat data berita...
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[800px] md:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-white font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">News Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Publication Date</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Headline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {news.map((item: NewsWithExtras) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors",
                        item.isHeadline && "ring-2 ring-green-400",
                      )}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl ? (
                            <ImageWithFallback
                              src={item.thumbnailUrl}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200 dark:border-gray-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-[#1F2937] flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-800">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className={cn(
                            "text-xs",
                            item.publishedAt
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-white border-gray-300 dark:border-slate-600",
                          )}
                        >
                          {item.publishedAt ? "✅ Dipublikasikan" : "📝 Draft"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-gray-500 dark:text-white text-xs">
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-700 dark:text-white">
                        {item.author?.agencyProfile?.agencyName ||
                          item.createdById}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="radio"
                          name="headline-news"
                          checked={!!item.isHeadline}
                          onChange={() => handleToggleHeadline(item.id)}
                          aria-label="Set as headline"
                        />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            onClick={() => handleEditOpen(item)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
