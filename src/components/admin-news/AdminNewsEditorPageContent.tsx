"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, ImageIcon } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/AppToaster";
import {
  createAdminNews,
  fetchAdminNewsItem,
  updateAdminNews,
} from "@/lib/admin-news/admin-news-api";
import {
  buildAdminNewsContent,
  splitAdminNewsContent,
} from "@/lib/admin-news/admin-news-content";
import { uploadAdminNewsImage } from "@/lib/admin-news/admin-news-upload";
import { AdminNewsImageDropzone } from "./AdminNewsImageDropzone";

type AdminNewsEditorMode = "create" | "edit";

type AdminNewsEditorPageContentProps = {
  mode: AdminNewsEditorMode;
  newsId?: string;
};

type AdminNewsEditorForm = {
  title: string;
  hook: string;
  content: string;
  thumbnailUrl: string;
};

const emptyForm: AdminNewsEditorForm = {
  title: "",
  hook: "",
  content: "",
  thumbnailUrl: "",
};

export function AdminNewsEditorPageContent({
  mode,
  newsId,
}: AdminNewsEditorPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const isCreate = mode === "create";

  const [formData, setFormData] = useState<AdminNewsEditorForm>(emptyForm);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isCreate || !newsId) return;
    const editingNewsId = newsId;

    async function loadNews() {
      try {
        setIsLoading(true);
        const news = await fetchAdminNewsItem(editingNewsId);
        const articleContent = splitAdminNewsContent(news.content);

        setFormData({
          title: news.title || "",
          hook: articleContent.hook,
          content: articleContent.content,
          thumbnailUrl: news.thumbnailUrl || "",
        });
      } catch (error) {
        toast.error(
          "News failed to load",
          error instanceof Error ? error.message : "Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, [isCreate, newsId, toast]);

  const thumbnailPreviewUrl = useMemo(() => {
    if (thumbnailFile) return URL.createObjectURL(thumbnailFile);
    return formData.thumbnailUrl;
  }, [formData.thumbnailUrl, thumbnailFile]);

  useEffect(() => {
    if (!thumbnailFile || !thumbnailPreviewUrl) return;
    return () => URL.revokeObjectURL(thumbnailPreviewUrl);
  }, [thumbnailFile, thumbnailPreviewUrl]);

  function updateFormData(field: keyof AdminNewsEditorForm, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.[0]) {
      setThumbnailFile(event.dataTransfer.files[0]);
    }
  }

  function validateForm() {
    if (formData.title.trim().length < 5) {
      return "News name must be at least 5 characters.";
    }
    if (!formData.hook.trim()) return "Hook sentence is required.";
    if (!formData.content.trim()) return "Content is required.";
    if (!thumbnailFile && !formData.thumbnailUrl) {
      return "Thumbnail is required.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error("Validation failed", validationError);
      return;
    }

    setIsSaving(true);

    try {
      let thumbnailUrl = formData.thumbnailUrl;

      if (thumbnailFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadAdminNewsImage(thumbnailFile);
        setIsUploading(false);

        if (!uploadedUrl) {
          toast.error("Upload failed", "Failed to upload the news thumbnail.");
          return;
        }

        thumbnailUrl = uploadedUrl;
      }

      const values = {
        title: formData.title.trim(),
        content: buildAdminNewsContent(formData.hook, formData.content),
        thumbnailUrl,
      };

      if (isCreate) {
        await createAdminNews(values);
        toast.success("Success", "News created.");
      } else if (newsId) {
        await updateAdminNews(newsId, values);
        toast.success("Saved", "News changes saved.");
      }

      router.push("/admin/news");
      router.refresh();
    } catch (error) {
      toast.error(
        isCreate ? "Create failed" : "Save failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <LoadingState
        label="Loading news editor..."
        className="h-full min-h-[500px]"
      />
    );
  }

  const submitLabel = isSaving
    ? "Saving..."
    : isCreate
      ? "Publish News"
      : "Save Changes";

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {isCreate ? "Create News" : "Edit News"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
              {isCreate
                ? "Publish a community update."
                : "Update the article content and thumbnail."}
            </p>
          </div>
          <Button
            type="submit"
            form="admin-news-editor-form"
            disabled={isSaving}
            className="hidden h-11 items-center justify-center rounded-xl bg-green-600 px-6 text-xs font-bold hover:bg-green-700 md:inline-flex"
          >
            {submitLabel}
          </Button>
        </div>

        <form
          id="admin-news-editor-form"
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >
          <Card className="space-y-5 rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827] md:p-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
              <FileText className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">
                News Content
              </h2>
            </div>

            <AdminNewsEditorField
              id="news-title"
              label="News Name"
              value={formData.title}
              placeholder="Enter news title..."
              onChange={(value) => updateFormData("title", value)}
            />

            <AdminNewsEditorTextarea
              id="news-hook"
              label="Hook Sentence"
              value={formData.hook}
              placeholder="Write the opening sentence that will be visually highlighted..."
              rows={3}
              onChange={(value) => updateFormData("hook", value)}
            />

            <AdminNewsEditorTextarea
              id="news-content"
              label="Content"
              value={formData.content}
              placeholder="Write the full news content..."
              rows={12}
              onChange={(value) => updateFormData("content", value)}
            />
          </Card>

          <Card className="rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#111827] md:p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-gray-800">
              <ImageIcon className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-black text-gray-900 dark:text-white">
                Thumbnail
              </h2>
            </div>
            <AdminNewsImageDropzone
              file={thumbnailFile}
              inputId="news-thumbnail-input"
              isDragging={isDragging}
              isUploading={isUploading}
              previewUrl={thumbnailPreviewUrl}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onFileChange={setThumbnailFile}
            />
          </Card>

          <Button
            type="submit"
            disabled={isSaving}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-green-600 text-sm font-bold hover:bg-green-700 md:hidden"
          >
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AdminNewsEditorField({
  id,
  label,
  onChange,
  placeholder,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400"
      >
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400 dark:border-slate-700 dark:bg-[#0B1120] dark:text-white"
      />
    </div>
  );
}

function AdminNewsEditorTextarea({
  id,
  label,
  onChange,
  placeholder,
  rows,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400"
      >
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-900 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-400 dark:border-slate-700 dark:bg-[#0B1120] dark:text-white"
      />
    </div>
  );
}
