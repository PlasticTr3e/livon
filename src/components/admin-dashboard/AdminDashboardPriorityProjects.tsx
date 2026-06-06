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
    <Card className="border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">
            Priority Projects
          </h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
            Most active projects based on popularity and AI sentiment analysis
          </p>
        </div>
        <PriorityProjectSortControl
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-white">
              <th className="px-4 py-3">Project Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Votes</th>
              <th className="px-4 py-3">Dominant Sentiment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {projects.length > 0 ? (
              projects.map((project) => (
                <PriorityProjectRow key={project.id} project={project} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-6 text-center text-sm text-gray-500 dark:text-white"
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
    <div className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-[#111827]">
      <SortButton
        isActive={sortBy === "viral"}
        label="Most Viral"
        onClick={() => onSortChange("viral")}
      />
      <SortButton
        isActive={sortBy === "sentiment"}
        label="Positive Sentiment"
        onClick={() => onSortChange("sentiment")}
      />
    </div>
  );
}

function SortButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all ${
        isActive
          ? "border border-gray-200 bg-white text-gray-900 shadow-sm dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
          : "text-gray-500 hover:text-gray-700 dark:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function PriorityProjectRow({ project }: { project: AdminDashboardProject }) {
  const sentiment = getDominantSentiment(
    project.sentimentAnalytics?.distribution,
  );

  return (
    <tr className="transition-colors hover:bg-gray-50 dark:bg-[#111827]">
      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">
        {project.title}
      </td>
      <td className="px-4 py-3">
        <Badge
          className={`rounded-md border-transparent px-2 py-0.5 text-[10px] font-bold ${getProjectStatusBadgeClass(project.status)}`}
        >
          {getProjectStatusLabel(project.status)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 dark:text-white">
        {project.totalVotes || 0} Votes
      </td>
      <td className="px-4 py-3">
        <Badge
          className={`rounded-md border-transparent px-2 py-0.5 text-[10px] font-bold ${sentiment.color}`}
        >
          {sentiment.label}
          {sentiment.percentage > 0 && (
            <span className="ml-1 opacity-75">({sentiment.percentage}%)</span>
          )}
        </Badge>
      </td>
    </tr>
  );
}
