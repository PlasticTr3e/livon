export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User, Tag, Newspaper } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import prisma from "@/lib/prisma";

type AgencyProfile = { agencyName: string };
type Author = {
  name?: string;
  agencyProfile?: AgencyProfile | null;
  [key: string]: unknown;
};
type Tag = { name: string } | string;
type Category = { name: string } | null;
type NewsArticle = {
  id: string;
  title: string;
  content?: string;
  thumbnailUrl?: string;
  publishedAt?: Date | string | null;
  createdById?: string;
  author?: Author | null;
  tags?: Tag[];
  category?: Category;
};

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.id || typeof resolvedParams.id !== "string") {
    return notFound();
  }

  // Fetch article with possible relations (author, tags, category)
  const article = (await prisma.news.findFirst({
    where: {
      id: resolvedParams.id,
      deletedAt: null,
    },
    include: {
      author: { include: { agencyProfile: true } },
    },
  })) as NewsArticle | null;

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-[#0B1120] gap-4">
        <Newspaper className="w-12 h-12 text-gray-300 dark:text-white" />
        <p className="text-gray-500 dark:text-white font-semibold">
          Article not found.
        </p>
        <Link
          href="/news"
          className="text-sm font-bold text-gray-900 dark:text-white underline"
        >
          Back to News
        </Link>
      </div>
    );
  }

  let author = "Admin";
  if (article.author) {
    author =
      article.author.agencyProfile?.agencyName ||
      article.author.name ||
      "Administrator";
  } else if (article.createdById) {
    author = article.createdById;
  }

  const tags: string[] = Array.isArray(article.tags)
    ? article.tags
        .map((t) =>
          typeof t === "string"
            ? t
            : t && typeof t === "object" && "name" in t
              ? t.name
              : "",
        )
        .filter(Boolean)
    : [];

  const fullContent = article.content || "";
  // Split by double newline or single newline to ensure we get paragraphs
  const body = fullContent.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  // If we have multiple paragraphs, use the first one as excerpt.
  // If only one, use a truncated version as excerpt and DON'T repeat it in the body.
  let displayExcerpt = "";
  let displayBody = body;

  if (body.length > 1) {
    displayExcerpt = body[0];
    displayBody = body.slice(1);
  } else if (body.length === 1) {
    displayExcerpt =
      body[0].slice(0, 150) + (body[0].length > 150 ? "..." : "");
    displayBody = body; // Show the full content in body if it's short
  }
  let date = "";
  if (article.publishedAt) {
    const pubDate =
      typeof article.publishedAt === "string"
        ? new Date(article.publishedAt)
        : article.publishedAt;
    date = !isNaN(pubDate.getTime()) ? pubDate.toLocaleDateString("id-ID") : "";
  }

  const related = await prisma.news.findMany({
    where: { id: { not: resolvedParams.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
        <Link
          href="/news"
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Kembali ke Berita</span>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          <article className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-white pb-6 border-b border-gray-200 dark:border-gray-800 mb-6">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{author}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {date}
              </span>
            </div>

            <div className="w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-8 border border-gray-200 dark:border-gray-800">
              <ImageWithFallback
                src={article.thumbnailUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            {displayExcerpt && (
              <p className="text-lg text-gray-600 dark:text-white leading-relaxed font-medium border-l-4 border-green-600 dark:border-green-500 pl-5 mb-8 italic">
                {displayExcerpt}
              </p>
            )}

            <div className="space-y-5">
              {displayBody.length > 0 ? (
                displayBody.map((para, i) => (
                  <p
                    key={i}
                    className="text-gray-700 dark:text-white leading-relaxed text-base"
                  >
                    {para}
                  </p>
                ))
              ) : (
                <p className="text-gray-400 italic">
                  Tidak ada konten tambahan.
                </p>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
                <Tag className="w-4 h-4 text-gray-400 dark:text-white flex-shrink-0" />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 rounded-full text-xs font-semibold text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-0 space-y-6">
              <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider mb-4">
                  About this news
                </p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-400 dark:text-white text-xs uppercase tracking-wider mb-0.5">
                      Author
                    </dt>
                    <dd className="font-semibold text-gray-800 dark:text-white">
                      {author}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 dark:text-white text-xs uppercase tracking-wider mb-0.5">
                      Published
                    </dt>
                    <dd className="font-semibold text-gray-800 dark:text-white">
                      {date}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-white uppercase tracking-wider mb-4">
                  Related News
                </p>
                <div className="space-y-4">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.id}`}
                      className="flex gap-3 group"
                    >
                      <div className="w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-800">
                        <ImageWithFallback
                          src={rel.thumbnailUrl}
                          alt={rel.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-white leading-snug line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          {rel.title}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-white mt-1">
                          {rel.publishedAt?.toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
