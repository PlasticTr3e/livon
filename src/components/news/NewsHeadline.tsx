"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatNewsDate } from "@/lib/news/news-format";
import type { NewsListItem } from "@/lib/news/news-types";
import { useHeadlineNewsId } from "./useHeadlineNewsId";

type NewsHeadlineProps = {
  isSearching: boolean;
  newsItems: NewsListItem[];
};

export function NewsHeadline({ newsItems, isSearching }: NewsHeadlineProps) {
  const headlineId = useHeadlineNewsId();
  const headline = useMemo(() => {
    if (isSearching || !headlineId) return null;
    return newsItems.find((news) => news.id === headlineId) || null;
  }, [headlineId, isSearching, newsItems]);

  if (!headline) return null;

  return (
    <Link
      href={`/news/${headline.id}`}
      className="group relative mb-8 block cursor-pointer overflow-hidden rounded-2xl border-2 border-green-600 shadow-lg transition-shadow hover:shadow-xl dark:border-green-700"
    >
      <div className="md:flex">
        <div className="relative h-64 overflow-hidden bg-green-900 md:h-80 md:w-1/2">
          {headline.thumbnailUrl ? (
            <ImageWithFallback
              src={headline.thumbnailUrl}
              alt={headline.title}
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-green-900 via-green-900/40 to-transparent" />
        </div>
        <div className="flex flex-col justify-center bg-gradient-to-br from-green-800 to-green-900 p-8 text-white md:w-1/2 md:p-12">
          <span className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-300">
            <Clock className="h-3.5 w-3.5" />
            {formatNewsDate(headline.publishedAt)}
          </span>
          <h2 className="mb-4 text-2xl font-bold leading-tight decoration-yellow-400 underline-offset-8 group-hover:underline md:text-3xl">
            {headline.title}
          </h2>
          <p className="mb-6 line-clamp-3 text-base leading-relaxed text-green-200">
            {headline.content?.slice(0, 120) ?? ""}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <span className="flex items-center gap-2 rounded-full border border-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:border-yellow-400 group-hover:bg-yellow-400 group-hover:text-yellow-900">
              Baca Selengkapnya <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
