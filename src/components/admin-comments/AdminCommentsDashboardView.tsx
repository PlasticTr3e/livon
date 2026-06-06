import { AdminCommentsInsights } from "@/components/admin-comments/AdminCommentsInsights";
import { AdminCommentsProjectFilters } from "@/components/admin-comments/AdminCommentsProjectFilters";
import { AdminCommentsProjectGrid } from "@/components/admin-comments/AdminCommentsProjectGrid";
import type {
  AdminCommentProjectSort,
  AdminCommentProjectSummary,
  AdminCommentsInsight,
  AdminCommentSelectedProject,
} from "@/lib/admin-comments/admin-comments-types";

type AdminCommentsDashboardViewProps = {
  isLoading: boolean;
  insights: AdminCommentsInsight;
  projects: AdminCommentProjectSummary[];
  projectSearchQuery: string;
  projectSort: AdminCommentProjectSort;
  onProjectSearchChange: (searchQuery: string) => void;
  onProjectSortChange: (sort: AdminCommentProjectSort) => void;
  onSelectProject: (project: AdminCommentSelectedProject) => void;
};

export function AdminCommentsDashboardView({
  isLoading,
  insights,
  projects,
  projectSearchQuery,
  projectSort,
  onProjectSearchChange,
  onProjectSortChange,
  onSelectProject,
}: AdminCommentsDashboardViewProps) {
  return (
    <div className="space-y-6">
      <AdminCommentsInsights insights={insights} />

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h2 className="text-lg font-medium tracking-tight text-gray-900 dark:text-white">
          Project Dashboard
        </h2>
        <AdminCommentsProjectFilters
          searchQuery={projectSearchQuery}
          sort={projectSort}
          onSearchChange={onProjectSearchChange}
          onSortChange={onProjectSortChange}
        />
      </div>

      <AdminCommentsProjectGrid
        isLoading={isLoading}
        projects={projects}
        onSelectProject={onSelectProject}
      />
    </div>
  );
}
