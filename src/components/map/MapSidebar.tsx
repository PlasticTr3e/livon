import { memo } from "react";
import { Search, X } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { cn, Button } from "@/components/ui/primitives";
import { MAP_STATUS_FILTERS } from "@/lib/map/map-format";
import type { MapProject, MapStatusFilter } from "@/lib/map/map-types";
import { MapProjectCard } from "./MapProjectCard";

type MapSidebarProps = {
  filterStatus: MapStatusFilter;
  isLoading: boolean;
  isOpen: boolean;
  projects: MapProject[];
  searchQuery: string;
  selectedProjectId?: string;
  onClose: () => void;
  onProjectSelect: (project: MapProject) => void;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: MapStatusFilter) => void;
};

export const MapSidebar = memo(function MapSidebar({
  filterStatus,
  isLoading,
  isOpen,
  projects,
  searchQuery,
  selectedProjectId,
  onClose,
  onProjectSelect,
  onSearchChange,
  onStatusChange,
}: MapSidebarProps) {
  return (
    <aside
      className={cn(
        "absolute z-[1200] flex h-full w-80 flex-col border-r border-gray-200 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:border-gray-800 dark:bg-[#111827] md:relative md:z-auto md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-green-50 p-4 dark:border-gray-800 dark:from-slate-900 dark:to-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 dark:text-white">Projects</h2>
          <Button variant="ghost" className="p-1 md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white" />
          <input
            type="text"
            placeholder="Search here..."
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white dark:placeholder:text-slate-500"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {MAP_STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-all",
                filterStatus === status
                  ? "border-green-600 bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm"
                  : "border-gray-300 bg-white text-gray-600 hover:border-green-400 dark:border-slate-600 dark:bg-[#1F2937] dark:text-white dark:hover:border-green-600",
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {isLoading ? (
          <LoadingState
            label="Loading projects..."
            variant="panel"
            className="min-h-32 bg-transparent"
          />
        ) : projects.length === 0 ? (
          <p className="mt-5 text-center text-sm text-gray-500">
            Tidak ada proyek yang ditemukan.
          </p>
        ) : (
          projects.map((project) => (
            <MapProjectCard
              key={project.id}
              isSelected={selectedProjectId === project.id}
              project={project}
              onSelect={onProjectSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
});
