export const dynamic = "force-dynamic";

import { NewsPageContent } from "@/components/news/NewsPageContent";
import { getNewsPageData } from "@/lib/news/news-data";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const newsPageData = await getNewsPageData(params);

  return (
    <NewsPageContent
      isSearching={newsPageData.isSearching}
      newsItems={newsPageData.newsItems}
      query={newsPageData.query}
      sort={newsPageData.sort}
    />
  );
}
