import { Badge, Card, cn } from "@/components/ui/primitives";
import {
  formatAdminCrowdfundingAmount,
  getAdminCrowdfundingProjectStats,
  getAdminProjectDisplayStatus,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-format";
import type {
  AdminCrowdfundingProject,
  AdminCrowdfundingProjectStatusFilter,
  AdminCrowdfundingSelectedProject,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";
import { CreditCard, SearchX } from "lucide-react";

type AdminCrowdfundingProjectGridProps = {
  projects: AdminCrowdfundingProject[];
  statusFilter: AdminCrowdfundingProjectStatusFilter;
  onSelectProject: (project: AdminCrowdfundingSelectedProject) => void;
};

export function AdminCrowdfundingProjectGrid({
  projects,
  statusFilter,
  onSelectProject,
}: AdminCrowdfundingProjectGridProps) {
  if (projects.length === 0) {
    return <AdminCrowdfundingEmptyProjects />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <AdminCrowdfundingProjectCard
          key={project.id}
          project={project}
          statusFilter={statusFilter}
          onSelectProject={onSelectProject}
        />
      ))}
    </div>
  );
}

function AdminCrowdfundingProjectCard({
  project,
  statusFilter,
  onSelectProject,
}: {
  project: AdminCrowdfundingProject;
  statusFilter: AdminCrowdfundingProjectStatusFilter;
  onSelectProject: (project: AdminCrowdfundingSelectedProject) => void;
}) {
  const { collected, progress, target } =
    getAdminCrowdfundingProjectStats(project);

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col border-green-100 p-5 transition-all hover:border-green-400 hover:shadow-md"
      onClick={() => onSelectProject({ id: project.id, name: project.title })}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
          <CreditCard className="h-5 w-5" />
        </div>
        <Badge
          className={cn(
            "px-1.5 text-[9px]",
            statusFilter === "active"
              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
              : "bg-blue-100 text-blue-700 border-blue-300",
          )}
        >
          {getAdminProjectDisplayStatus(project.status)}
        </Badge>
      </div>

      <h3 className="mb-4 line-clamp-2 flex-1 font-bold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white">
        {project.title}
      </h3>

      <div className="mt-auto space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-gray-500 dark:text-white">Collected:</span>
          <span className="font-bold text-green-700">
            Rp {formatAdminCrowdfundingAmount(collected)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              statusFilter === "active"
                ? "bg-gradient-to-r from-green-400 to-yellow-400"
                : "bg-blue-500",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 dark:text-white">
          <span>{progress}% funded</span>
          <span>Target: Rp {formatAdminCrowdfundingAmount(target)}</span>
        </div>
      </div>
    </Card>
  );
}

function AdminCrowdfundingEmptyProjects() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-20 text-gray-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white">
      <SearchX className="h-12 w-12 opacity-20" />
      <p className="font-medium">No projects found.</p>
    </div>
  );
}
