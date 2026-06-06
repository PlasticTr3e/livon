"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SortAsc, SortDesc } from "lucide-react";
import type { NewsSortOption } from "@/lib/news/news-types";

type NewsFiltersProps = {
  initialQuery?: string;
  initialSort?: NewsSortOption;
};

export function NewsFilters({
  initialQuery = "",
  initialSort = "latest",
}: NewsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          updateFilters({ q: formData.get("q") as string });
        }}
        className="relative flex w-full md:w-80"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            key={initialQuery}
            name="q"
            type="text"
            defaultValue={initialQuery}
            placeholder="Search news..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-[#111827]"
          />
        </div>
      </form>

      <div className="relative w-full md:w-auto">
        <select
          defaultValue={initialSort}
          onChange={(event) => updateFilters({ sort: event.target.value })}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-sm font-semibold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white md:w-32"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {initialSort === "latest" ? (
            <SortDesc className="h-4 w-4" />
          ) : (
            <SortAsc className="h-4 w-4" />
          )}
        </div>
      </div>

      {isPending && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      )}
    </div>
  );
}
