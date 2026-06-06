import { ChevronDown, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { isAdminProjectStatus } from "@/lib/admin-projects/admin-projects-format";
import type { AdminProjectStatus } from "@/lib/admin-projects/admin-projects-types";

type AdminProjectsToolbarProps = {
  filterStatus: "All" | AdminProjectStatus;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: "All" | AdminProjectStatus) => void;
};

export function AdminProjectsToolbar({
  filterStatus,
  searchQuery,
  onSearchChange,
  onStatusChange,
}: AdminProjectsToolbarProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 pt-2 md:flex-row md:items-center">
      <h2 className="text-lg font-medium tracking-tight text-gray-900 dark:text-white">
        Project Dashboard
      </h2>

      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="h-11 w-full rounded-xl border-green-200 pl-9 text-xs font-medium"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="relative w-40 md:w-48">
          <select
            value={filterStatus}
            onChange={(event) => {
              const nextStatus = event.target.value;
              onStatusChange(
                nextStatus === "All" || isAdminProjectStatus(nextStatus)
                  ? nextStatus
                  : "All",
              );
            }}
            className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-9 pr-8 text-xs font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
          >
            <option value="All">All Status</option>
            <option value="USULAN">Planning</option>
            <option value="DISETUJUI">Funding</option>
            <option value="BERJALAN">Construction</option>
            <option value="SELESAI">Completed</option>
          </select>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
