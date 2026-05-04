"use client";

import { Search, SortAsc, SortDesc } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function NewsFilters({
  initialQuery = "",
  initialSort = "latest",
}: {
  initialQuery?: string;
  initialSort?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          defaultValue={initialQuery}
          placeholder="Search news..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateFilters({ q: (e.target as HTMLInputElement).value });
            }
          }}
          onBlur={(e) => updateFilters({ q: e.target.value })}
          className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
        />
      </div>

      <div className="relative">
        <select
          defaultValue={initialSort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="appearance-none h-10 pl-4 pr-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {initialSort === "latest" ? (
            <SortDesc className="w-4 h-4" />
          ) : (
            <SortAsc className="w-4 h-4" />
          )}
        </div>
      </div>

      {isPending && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
      )}
    </div>
  );
}
