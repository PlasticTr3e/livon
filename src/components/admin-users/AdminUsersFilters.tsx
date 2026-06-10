import Script from "next/script";
import { ChevronDown, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import type { AdminUserFilters } from "@/lib/admin-users/admin-users-types";

type AdminUsersFiltersProps = {
  filters: AdminUserFilters;
};

export function AdminUsersFilters({ filters }: AdminUsersFiltersProps) {
  return (
    <div className="mb-5 pt-2">
      <form
        id="user-filters-form"
        className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
        action="/admin/users"
      >
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            className="h-11 w-full rounded-xl border-green-200 pl-9 text-xs font-medium focus:ring-green-400"
            placeholder="Search user..."
            defaultValue={filters.search}
          />
        </div>

        <div className="relative w-full md:w-48">
          <select
            name="filter"
            defaultValue={filters.filter}
            data-auto-submit="true"
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-9 pr-8 text-xs font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
          >
            <option value="ALL">All Users</option>
            <option value="agency">Agency</option>
            <option value="resident">Resident</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        <button className="sr-only">Apply filters</button>
      </form>
      <Script id="users-filter-auto-submit" strategy="afterInteractive">
        {`
          if (!window.__livonUsersFilterBound) {
            window.__livonUsersFilterBound = true;
            document.addEventListener('change', function (event) {
              var target = event.target;
              if (!target || !target.matches || !target.matches('#user-filters-form [data-auto-submit="true"]')) return;
              var form = document.getElementById('user-filters-form');
              if (form) form.requestSubmit();
            });
          }
        `}
      </Script>
    </div>
  );
}
