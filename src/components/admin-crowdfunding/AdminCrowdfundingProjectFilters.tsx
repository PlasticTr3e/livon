import { Input } from "@/components/ui/primitives";
import type { AdminCrowdfundingProjectStatusFilter } from "@/lib/admin-crowdfunding/admin-crowdfunding-types";
import { Filter, Search } from "lucide-react";

type AdminCrowdfundingProjectFiltersProps = {
  searchQuery: string;
  statusFilter: AdminCrowdfundingProjectStatusFilter;
  onSearchChange: (searchQuery: string) => void;
  onStatusFilterChange: (
    statusFilter: AdminCrowdfundingProjectStatusFilter,
  ) => void;
};

export function AdminCrowdfundingProjectFilters({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: AdminCrowdfundingProjectFiltersProps) {
  return (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white" />
        <Input
          className="w-full border-green-200 pl-9"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="relative w-40">
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(
              event.target.value as AdminCrowdfundingProjectStatusFilter,
            )
          }
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-9 pr-8 text-xs font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
          <Filter className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
