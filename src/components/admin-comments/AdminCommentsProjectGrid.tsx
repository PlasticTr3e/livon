import { Badge, Card } from "@/components/ui/primitives";
import { LoadingState } from "@/components/shared/LoadingState";
import {
  getAdminCommentNeutralCount,
  getAdminCommentSentimentWidth,
} from "@/lib/admin-comments/admin-comments-format";
import type {
  AdminCommentProjectSummary,
  AdminCommentSelectedProject,
} from "@/lib/admin-comments/admin-comments-types";
import { MessageSquare, SearchX } from "lucide-react";

type AdminCommentsProjectGridProps = {
  isLoading: boolean;
  projects: AdminCommentProjectSummary[];
  onSelectProject: (project: AdminCommentSelectedProject) => void;
};

export function AdminCommentsProjectGrid({
  isLoading,
  projects,
  onSelectProject,
}: AdminCommentsProjectGridProps) {
  if (isLoading) {
    return (
      <LoadingState
        label="Loading projects..."
        variant="panel"
        className="bg-transparent"
      />
    );
  }

  if (projects.length === 0) {
    return <AdminCommentsEmptyProjects />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <AdminCommentsProjectCard
          key={project.id || "news"}
          project={project}
          onSelectProject={onSelectProject}
        />
      ))}
    </div>
  );
}

function AdminCommentsProjectCard({
  project,
  onSelectProject,
}: {
  project: AdminCommentProjectSummary;
  onSelectProject: (project: AdminCommentSelectedProject) => void;
}) {
  const neutralCount = getAdminCommentNeutralCount(project);

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col border-green-100 p-5 transition-all hover:border-green-400 hover:shadow-md dark:border-gray-800 dark:bg-[#1F2937] dark:hover:border-green-500"
      onClick={() => onSelectProject({ id: project.id, name: project.name })}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white dark:bg-green-900/30 dark:text-green-400">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {project.flaggedCount > 0 && (
            <Badge className="border-red-100 bg-red-50 px-1.5 text-[9px] text-red-600">
              {project.flaggedCount} Toxic
            </Badge>
          )}
        </div>
      </div>
      <h3 className="mb-3 line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
        {project.name}
      </h3>

      <div className="mt-auto space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white">
          <span>Sentiment Breakdown</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all"
            style={{
              width: `${getAdminCommentSentimentWidth(
                project.positiveCount,
                project.count,
              )}%`,
            }}
          />
          <div
            className="h-full bg-gray-300 transition-all"
            style={{
              width: `${getAdminCommentSentimentWidth(
                neutralCount,
                project.count,
              )}%`,
            }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{
              width: `${getAdminCommentSentimentWidth(
                project.negativeCount,
                project.count,
              )}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className="text-green-600">{project.positiveCount} Pos</span>
          <span className="text-red-600">{project.negativeCount} Neg</span>
        </div>
      </div>
    </Card>
  );
}

function AdminCommentsEmptyProjects() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <SearchX className="h-12 w-12 opacity-20" />
      <p className="font-medium">No projects found matching your search.</p>
    </div>
  );
}
