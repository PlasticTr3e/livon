import { Input } from "@/components/ui/primitives";
import type { AdminCommentProjectSort } from "@/lib/admin-comments/admin-comments-types";
import { Filter, Search } from "lucide-react";

type AdminCommentsProjectFiltersProps = {
  searchQuery: string;
  sort: AdminCommentProjectSort;
  onSearchChange: (searchQuery: string) => void;
  onSortChange: (sort: AdminCommentProjectSort) => void;
};

export function AdminCommentsProjectFilters({
  searchQuery,
  sort,
  onSearchChange,
  onSortChange,
}: AdminCommentsProjectFiltersProps) {
  return (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="w-full border-green-200 pl-9"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="relative w-32 md:w-48">
        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as AdminCommentProjectSort)
          }
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-9 pr-8 text-xs font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white md:text-sm"
        >
          <option value="latest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="positive">Most Positive</option>
          <option value="negative">Most Negative</option>
        </select>
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
          <Filter className="h-3.5 w-3.5" />
        </div>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
