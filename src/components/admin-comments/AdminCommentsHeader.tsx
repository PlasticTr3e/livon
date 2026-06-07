import type { AdminCommentSelectedProject } from "@/lib/admin-comments/admin-comments-types";

type AdminCommentsHeaderProps = {
  selectedProject: AdminCommentSelectedProject | null;
};

export function AdminCommentsHeader({
  selectedProject,
}: AdminCommentsHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Comments Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          {selectedProject
            ? `Managing comments for "${selectedProject.name}"`
            : "Select a project to monitor and manage discussions."}
        </p>
      </div>
    </div>
  );
}
