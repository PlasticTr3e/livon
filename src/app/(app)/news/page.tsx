export const dynamic = "force-dynamic";

import Link from "next/link";
import { Badge } from "@/components/ui/WireframePrimitives";
import {
  Clock,
  ChevronRight,
  Newspaper as NewsIcon,
  SearchX,
  ArrowLeft,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import prisma from "@/lib/prisma";
import { NewsFilters } from "./NewsFilters";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const sort = params.sort || "latest";

  const headline = await prisma.news.findFirst({
    orderBy: { publishedAt: "desc" },
  });

  const newsItems = await prisma.news.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
      // If not searching, we might want to exclude the headline from the grid
      // but only if it matches the latest. For now, let's just fetch all.
    },
    orderBy: { publishedAt: sort === "oldest" ? "asc" : "desc" },
    take: 20,
  });

  if (!newsItems || (newsItems.length === 0 && !query)) {
    return (
      <div className="p-8 text-center text-gray-400">Belum ada berita.</div>
    );
  }

  const isSearching = query !== "";
  // In the grid, if not searching, exclude the headline
  const grid = isSearching
    ? newsItems
    : newsItems.filter((item) => item.id !== headline?.id);

  // Debug info removed

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto w-full">
      {isSearching && (
        <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center shadow-sm">
          <Link
            href="/news"
            className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Kembali ke Berita</span>
          </Link>
        </div>
      )}

      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {!isSearching && headline && (
          <Link
            href={`/news/${headline.id}`}
            className="block overflow-hidden border-2 border-green-600 dark:border-green-700 shadow-lg rounded-2xl group cursor-pointer relative hover:shadow-xl transition-shadow"
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
                  {headline.publishedAt?.toLocaleDateString("id-ID")}
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
        )}

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              {isSearching ? `Hasil pencarian: "${query}"` : "All News"}
            </h3>
            <NewsFilters initialQuery={query} initialSort={sort} />
          </div>

          {grid.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {grid.map((news) => (
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
                        {news.publishedAt?.toLocaleDateString("id-ID")}
                      </span>
                      <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 group-hover:gap-1.5 transition-all">
                        Read More <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <SearchX className="w-12 h-12 opacity-20" />
              <p className="font-medium">
                Tidak ada berita yang cocok dengan pencarian Anda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
