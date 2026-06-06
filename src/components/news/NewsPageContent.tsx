import { NewsBackBar } from "./NewsBackBar";
import { NewsGrid } from "./NewsGrid";
import { NewsHeader } from "./NewsHeader";
import { NewsHeadline } from "./NewsHeadline";
import type { NewsListItem, NewsSortOption } from "@/lib/news/news-types";

type NewsPageContentProps = {
  isSearching: boolean;
  newsItems: NewsListItem[];
  query: string;
  sort: NewsSortOption;
};

export function NewsPageContent({
  isSearching,
  newsItems,
  query,
  sort,
}: NewsPageContentProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      {isSearching && <NewsBackBar />}

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">
        <NewsHeader query={query} sort={sort} />
        <NewsHeadline newsItems={newsItems} isSearching={isSearching} />

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-green-500" />
            <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
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
