export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsHeadline } from "./NewsHeadline";

import { NewsGrid } from "./NewsGrid";
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

  const newsItems = await prisma.news.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
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

  // NewsGrid will handle client-side headline sorting

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
        <NewsHeadline newsItems={newsItems} isSearching={isSearching} />

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight">
              {isSearching ? `Hasil pencarian: "${query}"` : "All News"}
            </h3>
            <NewsFilters initialQuery={query} initialSort={sort} />
          </div>

          <NewsGrid newsItems={newsItems} isSearching={isSearching} />
        </div>
      </div>
    </div>
  );
}
