export const dynamic = "force-dynamic";

import Link from "next/link";
import { Badge } from "@/components/ui/WireframePrimitives";
import { Clock, ChevronRight, Newspaper as NewsIcon } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import prisma from "@/lib/prisma";

const categoryColor: Record<string, string> = {
  Featured: "bg-green-700 text-white border-none",
  Policy: "bg-blue-600 text-white border-none",
  Environment:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700",
  Event:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  Report: "bg-gray-700 text-white border-none",
};

export default async function NewsPage() {
  const newsItems = await prisma.news.findMany({
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  if (!newsItems || newsItems.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">Belum ada berita.</div>
    );
  }

  const featured = newsItems[0];
  const grid = newsItems.slice(1);

  // Debug info removed

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto w-full">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center space-x-3 border-b-2 border-green-200 dark:border-green-800 pb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-sm">
            <NewsIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">
            Berita Komunitas
          </h1>
        </div>

        <Link
          href={`/news/${featured.id}`}
          className="block overflow-hidden border-2 border-green-600 dark:border-green-700 shadow-lg rounded-2xl group cursor-pointer relative hover:shadow-xl transition-shadow"
        >
          <div className="md:flex">
            <div className="md:w-1/2 h-64 md:h-80 relative bg-green-900 overflow-hidden">
              {featured.thumbnailUrl ? (
                <ImageWithFallback
                  src={featured.thumbnailUrl}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-green-900 via-green-900/40 to-transparent" />
              <Badge className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 border-none font-black uppercase tracking-widest shadow-sm">
                Featured
              </Badge>
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-green-800 to-green-900 text-white">
              <span className="text-xs font-bold text-green-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />{" "}
                {featured.publishedAt?.toLocaleDateString("id-ID")}
              </span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4 group-hover:underline decoration-4 underline-offset-8 decoration-yellow-400">
                {featured.title}
              </h2>
              <p className="text-green-200 text-base mb-6 leading-relaxed line-clamp-3">
                {featured.content?.slice(0, 120) ?? ""}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs font-bold text-green-400 uppercase tracking-widest">
                  Featured
                </span>
                <span className="flex items-center gap-2 px-4 py-2 border border-green-500 rounded-full text-sm font-semibold text-white group-hover:bg-yellow-400 group-hover:text-yellow-900 group-hover:border-yellow-400 transition-colors">
                  Baca Selengkapnya <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">
              Update Terbaru
            </h3>
          </div>
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
                  <span
                    className={`w-fit mb-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${categoryColor["Featured"]}`}
                  >
                    Featured
                  </span>
                  <p className="font-bold text-sm leading-snug mb-2 text-gray-800 dark:text-slate-200 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors line-clamp-2">
                    {news.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mb-3 leading-relaxed flex-1">
                    {news.content?.slice(0, 80) ?? ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{" "}
                      {news.publishedAt?.toLocaleDateString("id-ID")}
                    </span>
                    <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 group-hover:gap-1.5 transition-all">
                      Baca <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
