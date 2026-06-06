import { Input } from "@/components/ui/primitives";
import type { AdminCommentSentimentFilter } from "@/lib/admin-comments/admin-comments-types";
import { Filter, Search } from "lucide-react";

type AdminCommentsFiltersProps = {
  searchQuery: string;
  sentimentFilter: AdminCommentSentimentFilter;
  onSearchChange: (searchQuery: string) => void;
  onSentimentFilterChange: (filter: AdminCommentSentimentFilter) => void;
};

export function AdminCommentsFilters({
  searchQuery,
  sentimentFilter,
  onSearchChange,
  onSentimentFilterChange,
}: AdminCommentsFiltersProps) {
  return (
    <div className="mb-5 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="w-full border-green-200 pl-9"
          placeholder="Search comments or users..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="relative w-full md:w-44">
          <select
            value={sentimentFilter}
            onChange={(event) =>
              onSentimentFilterChange(
                event.target.value as AdminCommentSentimentFilter,
              )
            }
            className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-10 pr-8 text-sm font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
          >
            <option value="all">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
            <Filter className="h-4 w-4" />
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
    </div>
  );
}
