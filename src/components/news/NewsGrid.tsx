"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Clock, SearchX } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatNewsDate } from "@/lib/news/news-format";
import type { NewsListItem, NewsSortOption } from "@/lib/news/news-types";
import { useHeadlineNewsId } from "./useHeadlineNewsId";

type NewsGridProps = {
  currentSort?: NewsSortOption;
  isSearching: boolean;
  newsItems: NewsListItem[];
};

export function NewsGrid({
  newsItems,
  isSearching,
  currentSort = "latest",
}: NewsGridProps) {
  const headlineId = useHeadlineNewsId();
  const sortedNews = useMemo(() => {
    if (isSearching || currentSort !== "latest" || !headlineId) {
      return newsItems;
    }

    const headlineNews = newsItems.find((news) => news.id === headlineId);
    const rest = newsItems.filter((news) => news.id !== headlineId);
    return headlineNews ? [headlineNews, ...rest] : rest;
  }, [currentSort, headlineId, isSearching, newsItems]);

  if (sortedNews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
        <SearchX className="h-12 w-12 opacity-20" />
        <p className="font-medium">
          {isSearching
            ? "No news matches your search."
            : "There are no news updates yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {sortedNews.map((news) => (
        <Link
          key={news.id}
          href={`/news/${news.id}`}
          className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-green-300 hover:shadow-lg dark:border-gray-800 dark:bg-[#1F2937] dark:hover:border-green-700"
        >
          <div className="h-40 overflow-hidden">
            {news.thumbnailUrl ? (
              <ImageWithFallback
                src={news.thumbnailUrl}
                alt={news.title}
                className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
              />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <p className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-gray-800 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
              {news.title}
            </p>
            <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-gray-400 dark:text-white">
              {news.content?.slice(0, 80) ?? ""}
            </p>
            <div className="mt-auto flex items-center justify-between text-[11px] font-medium text-gray-400 dark:text-white">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatNewsDate(news.publishedAt)}
              </span>
              <span className="flex items-center gap-0.5 text-green-600 transition-all group-hover:gap-1.5 dark:text-green-400">
                Read More <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
