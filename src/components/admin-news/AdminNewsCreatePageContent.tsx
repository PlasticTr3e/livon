"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import type { AdminArticleFormData } from "@/lib/admin-news/admin-news-types";

const initialArticleFormData: AdminArticleFormData = {
  title: "",
  category: "announcement",
  content: "",
  status: "draft",
  featuredImage: "",
};

export function AdminNewsCreatePageContent() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialArticleFormData);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    router.push("/admin/news");
  }

  function updateFormData(field: keyof AdminArticleFormData, value: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-8 dark:bg-[#0B1120]">
      <AdminNewsCreateHeader
        onBack={() => router.push("/admin/news")}
        onPublish={() => router.push("/admin/news")}
        onSaveDraft={handleSubmit}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminNewsArticleForm formData={formData} onChange={updateFormData} />
        <AdminNewsMetadataForm formData={formData} onChange={updateFormData} />
        <AdminNewsArticlePreview formData={formData} />
      </form>
    </div>
  );
}

function AdminNewsCreateHeader({
  onBack,
  onPublish,
  onSaveDraft,
}: {
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: (event: React.FormEvent) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md p-2 transition-colors hover:bg-white dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Article
          </h1>
          <p className="text-gray-500 dark:text-white">
            Write and publish news for the community
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          className="flex items-center space-x-2 border-green-300 text-green-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Draft</span>
        </Button>
        <Button
          type="button"
          onClick={onPublish}
          className="flex items-center space-x-2 bg-gray-900 text-white hover:bg-gray-700"
        >
          <Eye className="h-4 w-4" />
          <span>Publish</span>
        </Button>
      </div>
    </div>
  );
}

function AdminNewsArticleForm({
  formData,
  onChange,
}: {
  formData: AdminArticleFormData;
  onChange: (field: keyof AdminArticleFormData, value: string) => void;
}) {
  return (
    <Card className="space-y-6 border-gray-200 p-6 shadow-sm dark:border-gray-800">
      <AdminNewsTextField
        id="title"
        label="Article Title"
        required
        value={formData.title}
        onChange={(value) => onChange("title", value)}
        placeholder="Enter article title..."
      />
      <div className="space-y-2">
        <label
          htmlFor="category"
          className="block text-sm font-semibold text-gray-700 dark:text-white"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(event) => onChange("category", event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white"
        >
          <option value="announcement">Announcement</option>
          <option value="update">Update</option>
          <option value="event">Event</option>
          <option value="report">Report</option>
          <option value="general">General</option>
        </select>
      </div>
      <AdminNewsTextField
        id="featuredImage"
        label="Featured Image URL"
        type="url"
        value={formData.featuredImage}
        onChange={(value) => onChange("featuredImage", value)}
        placeholder="https://example.com/image.jpg"
      />
      {formData.featuredImage && (
        <div className="relative mt-3 h-48 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
          <ImageWithFallback
            src={formData.featuredImage}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        <label
          htmlFor="content"
          className="block text-sm font-semibold text-gray-700 dark:text-white"
        >
          Article Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={formData.content}
          onChange={(event) => onChange("content", event.target.value)}
          placeholder="Write your article content here..."
          rows={12}
          className="w-full resize-none rounded-md border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white"
          required
        />
        <p className="text-xs text-gray-400 dark:text-white">
          {formData.content.length} characters
        </p>
      </div>
    </Card>
  );
}

function AdminNewsMetadataForm({
  formData,
  onChange,
}: {
  formData: AdminArticleFormData;
  onChange: (field: keyof AdminArticleFormData, value: string) => void;
}) {
  return (
    <Card className="space-y-4 border-gray-200 p-6 shadow-sm dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Metadata
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Author
          </label>
          <input
            type="text"
            value="RT 01 / RW 03"
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-white">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <AdminNewsTextField
        label="Tags"
        placeholder="e.g., infrastructure, community (comma-separated)"
      />
    </Card>
  );
}

function AdminNewsArticlePreview({
  formData,
}: {
  formData: AdminArticleFormData;
}) {
  return (
    <Card className="space-y-4 border-gray-200 p-6 shadow-sm dark:border-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Preview
      </h3>
      <div className="space-y-3 rounded-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-[#1F2937]">
        <div className="flex items-center space-x-2">
          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-medium uppercase text-white">
            {formData.category}
          </span>
          <span className="text-xs text-gray-400 dark:text-white">
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {formData.title || "Article Title"}
        </h2>
        <p className="whitespace-pre-wrap text-gray-600 dark:text-white">
          {formData.content || "Article content will appear here..."}
        </p>
      </div>
    </Card>
  );
}

function AdminNewsTextField({
  id,
  label,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  id?: string;
  label: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 dark:text-white"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white"
        required={required}
      />
    </div>
  );
}
