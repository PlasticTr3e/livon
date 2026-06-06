import Link from "next/link";
import { Edit2, Trash2 } from "lucide-react";
import { Card, cn } from "@/components/ui/primitives";
import { ADMIN_PROJECT_STATUS_CONFIG } from "@/lib/admin-projects/admin-projects-format";
import type { AdminProjectSummary } from "@/lib/admin-projects/admin-projects-types";

type AdminProjectsTableProps = {
  isLoading: boolean;
  projects: AdminProjectSummary[];
  onDelete: (projectId: string) => void;
  onView: (projectId: string) => void;
};

export function AdminProjectsTable({
  isLoading,
  projects,
  onDelete,
  onView,
}: AdminProjectsTableProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
              <th className="px-8 py-4">Project Details</th>
              <th className="px-4 py-4 text-center">Status</th>
              <th className="px-4 py-4 text-center">Category</th>
              <th className="px-4 py-4">Budget</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-24 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-white"
                >
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <AdminProjectsTableRow
                  key={project.id}
                  project={project}
                  onDelete={onDelete}
                  onView={onView}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AdminProjectsTableRow({
  project,
  onDelete,
  onView,
}: {
  project: AdminProjectSummary;
  onDelete: (projectId: string) => void;
  onView: (projectId: string) => void;
}) {
  const statusConfig = ADMIN_PROJECT_STATUS_CONFIG[project.status];

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20"
      onClick={() => onView(project.id)}
    >
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
            {project.name}
          </span>
          <span className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white">
            Created {project.date}
          </span>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <div
            className={cn(
              "flex items-center justify-center rounded-full border px-4 py-1.5 text-[10px] font-semibold",
              statusConfig.style,
            )}
          >
            {statusConfig.label}
          </div>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <span className="rounded-full border border-slate-100 bg-slate-50 px-4 py-1 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {project.category}
          </span>
        </div>
      </td>
      <td className="px-4 py-6 text-xs font-semibold text-gray-700 dark:text-white">
        {project.budget}
      </td>
      <td className="px-8 py-6">
        <div
          className="flex items-center justify-end gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <Link href={`/admin/projects/${project.id}?mode=edit`}>
            <button className="rounded-xl border border-gray-100 bg-white p-2.5 text-green-600 shadow-sm transition-all hover:bg-green-600 hover:text-white dark:border-gray-800 dark:bg-[#1F2937] dark:text-green-400 dark:hover:bg-green-700">
              <Edit2 className="h-4 w-4" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => onDelete(project.id)}
            className="rounded-xl border border-gray-100 bg-white p-2.5 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white dark:border-gray-800 dark:bg-[#1F2937] dark:text-red-400 dark:hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
