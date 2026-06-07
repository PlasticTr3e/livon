export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Newspaper } from "lucide-react";
import { NewsHeadline } from "./_components/NewsHeadline";

import { NewsGrid } from "./_components/NewsGrid";
import prisma from "@/lib/prisma";
import { NewsFilters } from "./_components/NewsFilters";
import type { Prisma } from "@/generated/prisma/client";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const sort = params.sort || "latest";

  const where: Prisma.NewsWhereInput = {
    deletedAt: null,
  };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ];
  }

  const newsItems = await prisma.news.findMany({
    where,
    orderBy: [
      { publishedAt: sort === "oldest" ? "asc" : "desc" },
      { createdAt: sort === "oldest" ? "asc" : "desc" },
    ],
    take: 30,
  });

  const isSearching = !!query;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto w-full">
      {isSearching && (
        <div className="sticky top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center shadow-sm">
          <Link
            href="/news"
            className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Kembali ke Berita</span>
          </Link>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full space-y-8">
        {/* Header & Search - Crowdfunding Style */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                  News & Updates
                </h1>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-white ml-[52px] max-w-md leading-relaxed">
              Stay informed about the latest developments and stories from our
              community projects.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <NewsFilters initialQuery={query} initialSort={sort} />
          </div>
        </div>

        <NewsHeadline newsItems={newsItems} isSearching={isSearching} />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-green-500 rounded-full" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {isSearching ? `Search Results: "${query}"` : "All News"}
            </h3>
          </div>

          <NewsGrid
            newsItems={newsItems}
            isSearching={isSearching}
            currentSort={sort}
          />
        </div>
      </div>
    </div>
  );
}
