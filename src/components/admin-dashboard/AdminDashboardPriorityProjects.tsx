import { Badge, Card } from "@/components/ui/primitives";
import {
  getDominantSentiment,
  getProjectStatusBadgeClass,
  getProjectStatusLabel,
} from "@/lib/admin-dashboard/admin-dashboard-format";
import type {
  AdminDashboardProject,
  AdminDashboardSortMode,
} from "@/lib/admin-dashboard/admin-dashboard-types";
import { ChevronDown, Filter } from "lucide-react";

type AdminDashboardPriorityProjectsProps = {
  projects: AdminDashboardProject[];
  sortBy: AdminDashboardSortMode;
  onSortChange: (sortBy: AdminDashboardSortMode) => void;
};

export function AdminDashboardPriorityProjects({
  projects,
  sortBy,
  onSortChange,
}: AdminDashboardPriorityProjectsProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Priority Projects
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white">
            Most active projects based on popularity and AI sentiment analysis
          </p>
        </div>
        <PriorityProjectSortControl
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
              <th className="px-8 py-4">Project Details</th>
              <th className="px-4 py-4 text-center">Status</th>
              <th className="px-4 py-4">Total Votes</th>
              <th className="px-8 py-4 text-center">Dominant Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {projects.length > 0 ? (
              projects.map((project) => (
                <PriorityProjectRow key={project.id} project={project} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-24 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-white"
                >
                  No projects meet the criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PriorityProjectSortControl({
  sortBy,
  onSortChange,
}: {
  sortBy: AdminDashboardSortMode;
  onSortChange: (sortBy: AdminDashboardSortMode) => void;
}) {
  return (
    <div className="relative w-full md:w-48">
      <select
        value={sortBy}
        onChange={(event) => onSortChange(getSortMode(event.target.value))}
        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-9 pr-8 text-xs font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
      >
        <option value="viral">Most Viral</option>
        <option value="sentiment">Positive Sentiment</option>
      </select>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
        <Filter className="h-3.5 w-3.5" />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}

function getSortMode(value: string): AdminDashboardSortMode {
  return value === "sentiment" ? "sentiment" : "viral";
}

function PriorityProjectRow({ project }: { project: AdminDashboardProject }) {
  const sentiment = getDominantSentiment(
    project.sentimentAnalytics?.distribution,
  );

  return (
    <tr className="group transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20">
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
            {project.title}
          </span>
          <span className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white">
            Priority project
          </span>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <Badge
            className={`rounded-full border-transparent px-4 py-1.5 text-[10px] font-semibold ${getProjectStatusBadgeClass(project.status)}`}
          >
            {getProjectStatusLabel(project.status)}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-6 text-xs font-semibold text-gray-700 dark:text-white">
        {project.totalVotes || 0} Votes
      </td>
      <td className="px-8 py-6">
        <div className="flex justify-center">
          <Badge
            className={`rounded-full border-transparent px-4 py-1.5 text-[10px] font-semibold ${sentiment.color}`}
          >
            {sentiment.label}
            {sentiment.percentage > 0 && (
              <span className="ml-1 opacity-75">({sentiment.percentage}%)</span>
            )}
          </Badge>
        </div>
      </td>
    </tr>
  );
}
