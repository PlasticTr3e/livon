import { Newspaper } from "lucide-react";
import { NewsFilters } from "./NewsFilters";
import type { NewsSortOption } from "@/lib/news/news-types";

type NewsHeaderProps = {
  query: string;
  sort: NewsSortOption;
};

export function NewsHeader({ query, sort }: NewsHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 border-b border-gray-200 pb-6 dark:border-gray-800 md:flex-row md:items-end">
      <div>
        <div className="mb-2.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
            <Newspaper className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            News & Updates
          </h1>
        </div>
        <p className="ml-[52px] max-w-md text-sm leading-relaxed text-gray-500 dark:text-white">
          Stay informed about the latest developments and stories from our
          community projects.
        </p>
      </div>

      <div className="relative w-full shrink-0 md:w-80">
        <NewsFilters initialQuery={query} initialSort={sort} />
      </div>
    </div>
  );
}
