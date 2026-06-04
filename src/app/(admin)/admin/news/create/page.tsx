"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, Button } from "@/components/ui/primitives";
import { ArrowLeft, Save, Eye } from "lucide-react";

export default function CreateArticlePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "announcement",
    content: "",
    status: "draft",
    featuredImage: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/admin/news");
  };

  const handlePublish = () => {
    router.push("/admin/news");
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-[#0B1120] min-h-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/admin/news")}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-white" />
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
            onClick={handleSubmit}
            className="flex items-center space-x-2 border-green-300 text-green-700"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </Button>
          <Button
            onClick={handlePublish}
            className="flex items-center space-x-2 bg-gray-900 text-white hover:bg-gray-700"
          >
            <Eye className="w-4 h-4" />
            <span>Publish</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 dark:text-white"
            >
              Article Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter article title..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 bg-white dark:bg-[#1F2937]"
              required
            />
          </div>
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
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white bg-white dark:bg-[#1F2937]"
            >
              <option value="announcement">Announcement</option>
              <option value="update">Update</option>
              <option value="event">Event</option>
              <option value="report">Report</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="featuredImage"
              className="block text-sm font-semibold text-gray-700 dark:text-white"
            >
              Featured Image URL
            </label>
            <input
              id="featuredImage"
              type="url"
              value={formData.featuredImage}
              onChange={(e) =>
                setFormData({ ...formData, featuredImage: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white placeholder:text-gray-400 bg-white dark:bg-[#1F2937]"
            />
            {formData.featuredImage && (
              <div className="mt-3 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden relative h-48">
                <Image
                  src={formData.featuredImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
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
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Write your article content here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none font-mono text-sm bg-white dark:bg-[#1F2937]"
              required
            />
            <p className="text-xs text-gray-400 dark:text-white">
              {formData.content.length} characters
            </p>
          </div>
        </Card>

        <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white bg-white dark:bg-[#1F2937]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white">
              Tags
            </label>
            <input
              type="text"
              placeholder="e.g., infrastructure, community (comma-separated)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 dark:text-white placeholder:text-gray-400 bg-white dark:bg-[#1F2937]"
            />
          </div>
        </Card>

        <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preview
          </h3>
          <div className="border border-gray-200 dark:border-gray-800 rounded-md p-6 bg-white dark:bg-[#1F2937] space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full uppercase">
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
            <p className="text-gray-600 dark:text-white whitespace-pre-wrap">
              {formData.content || "Article content will appear here..."}
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
}
