import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { normalizeNewsQuery, normalizeNewsSort } from "./news-format";
import type { NewsArticle, NewsPageSearchParams } from "./news-types";

export async function getNewsPageData(searchParams: NewsPageSearchParams) {
  const query = normalizeNewsQuery(searchParams.q);
  const sort = normalizeNewsSort(searchParams.sort);
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

  return {
    isSearching: Boolean(query),
    newsItems,
    query,
    sort,
  };
}

export async function getNewsArticle(articleId: string) {
  return prisma.news.findFirst({
    where: {
      id: articleId,
      deletedAt: null,
    },
    include: {
      author: { include: { agencyProfile: true } },
    },
  }) as Promise<NewsArticle | null>;
}

export async function getRelatedNews(articleId: string) {
  return prisma.news.findMany({
    where: {
      id: { not: articleId },
      deletedAt: null,
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}
