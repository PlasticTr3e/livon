"use client";

import Link from "next/link";
import { Clock, ChevronRight, SearchX } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export interface NewsGridItem {
  id: string;
  title: string;
  content?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | Date | null;
}

export function NewsGrid({
  newsItems,
  isSearching,
}: {
  newsItems: NewsGridItem[];
  isSearching: boolean;
}) {
  let sortedNews = newsItems;
  if (!isSearching && typeof window !== "undefined") {
    const headlineId = localStorage.getItem("headline-news-id");
    if (headlineId) {
      const headlineNews = newsItems.find((n) => n.id === headlineId);
      const rest = newsItems.filter((n) => n.id !== headlineId);
      sortedNews = headlineNews ? [headlineNews, ...rest] : rest;
    }
  }

  if (!sortedNews || sortedNews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
        <SearchX className="w-12 h-12 opacity-20" />
        <p className="font-medium">
          Tidak ada berita yang cocok dengan pencarian Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {sortedNews.map((news) => (
        <Link
          key={news.id}
          href={`/news/${news.id}`}
          className="flex flex-col border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all group cursor-pointer overflow-hidden"
        >
          <div className="h-40 overflow-hidden">
            {news.thumbnailUrl ? (
              <ImageWithFallback
                src={news.thumbnailUrl}
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
              />
            ) : null}
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <p className="font-bold text-sm leading-snug mb-2 text-gray-800 dark:text-slate-200 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors line-clamp-2">
              {news.title}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mb-3 leading-relaxed flex-1">
              {news.content?.slice(0, 80) ?? ""}
            </p>
            <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{" "}
                {news.publishedAt
                  ? new Date(news.publishedAt).toLocaleDateString("id-ID")
                  : ""}
              </span>
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 group-hover:gap-1.5 transition-all">
                Read More <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
