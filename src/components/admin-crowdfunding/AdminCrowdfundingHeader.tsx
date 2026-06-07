import type { AdminCrowdfundingSelectedProject } from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

type AdminCrowdfundingHeaderProps = {
  selectedProject: AdminCrowdfundingSelectedProject | null;
};

export function AdminCrowdfundingHeader({
  selectedProject,
}: AdminCrowdfundingHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {selectedProject ? "Transaction History" : "Crowdfunding Management"}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          {selectedProject
            ? `Viewing transactions for "${selectedProject.name}"`
            : "Track all donations and funding progress."}
        </p>
      </div>
    </div>
  );
}
