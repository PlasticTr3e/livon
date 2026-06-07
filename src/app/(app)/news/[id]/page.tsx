export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { NewsDetailPageContent } from "@/components/news/NewsDetailPageContent";
import { NewsNotFoundState } from "@/components/news/NewsNotFoundState";
import { getNewsArticle, getRelatedNews } from "@/lib/news/news-data";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;

  if (!resolvedParams?.id || typeof resolvedParams.id !== "string") {
    return notFound();
  }

  const article = await getNewsArticle(resolvedParams.id);

  if (!article) {
    return <NewsNotFoundState />;
  }

  const relatedNews = await getRelatedNews(resolvedParams.id);

  return <NewsDetailPageContent article={article} relatedNews={relatedNews} />;
}
