import Script from "next/script";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import type { AdminUserFilters } from "@/lib/admin-users/admin-users-types";

type AdminUsersFiltersProps = {
  filters: AdminUserFilters;
};

export function AdminUsersFilters({ filters }: AdminUsersFiltersProps) {
  return (
    <div className="mb-5">
      <form
        id="user-filters-form"
        className="flex items-center justify-between"
        action="/admin/users"
      >
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            name="search"
            className="border-green-200 pl-9 focus:ring-green-400"
            placeholder="Search user..."
            defaultValue={filters.search}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            name="role"
            defaultValue={filters.role}
            data-auto-submit="true"
            className="cursor-pointer rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-[#1F2937]"
          >
            <option value="ALL">All Role</option>
            <option value="resident">Resident</option>
            <option value="agency">Agency</option>
          </select>
          <select
            name="status"
            defaultValue={filters.status}
            data-auto-submit="true"
            className="cursor-pointer rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-[#1F2937]"
          >
            <option value="ALL">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
          </select>
          <button className="sr-only">Apply filters</button>
        </div>
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
