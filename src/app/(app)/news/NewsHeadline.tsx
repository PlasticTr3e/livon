"use client";

import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

import type { NewsGridItem } from "./NewsGrid";

export function NewsHeadline({
  newsItems,
  isSearching,
}: {
  newsItems: NewsGridItem[];
  isSearching: boolean;
}) {
  let headline: NewsGridItem | null = null;
  if (!isSearching && typeof window !== "undefined") {
    const headlineId = localStorage.getItem("headline-news-id");
    if (headlineId) {
      const found = newsItems.find((n) => n.id === headlineId);
      headline = found || null;
    }
  }
  if (!headline || isSearching) return null;

  return (
    <Link
      href={`/news/${headline.id}`}
      className="block overflow-hidden border-2 border-green-600 dark:border-green-700 shadow-lg rounded-2xl group cursor-pointer relative hover:shadow-xl transition-shadow mb-8"
    >
      <div className="md:flex">
        <div className="md:w-1/2 h-64 md:h-80 relative bg-green-900 overflow-hidden">
          {headline.thumbnailUrl ? (
            <ImageWithFallback
              src={headline.thumbnailUrl}
              alt={headline.title}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-green-900 via-green-900/40 to-transparent" />
        </div>
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-green-800 to-green-900 text-white">
          <span className="text-xs font-bold text-green-300 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />{" "}
            {headline.publishedAt
              ? new Date(headline.publishedAt).toLocaleDateString("id-ID")
              : ""}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4 group-hover:underline underline-offset-8 decoration-yellow-400">
            {headline.title}
          </h2>
          <p className="text-green-200 text-base mb-6 leading-relaxed line-clamp-3">
            {headline.content?.slice(0, 120) ?? ""}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="flex items-center gap-2 px-4 py-2 border border-green-500 rounded-full text-sm font-semibold text-white group-hover:bg-yellow-400 group-hover:text-yellow-900 group-hover:border-yellow-400 transition-colors">
              Baca Selengkapnya <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
