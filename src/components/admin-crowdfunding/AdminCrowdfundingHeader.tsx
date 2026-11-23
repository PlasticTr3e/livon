"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { AdminCrowdfundingSelectedProject } from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

type AdminCrowdfundingHeaderProps = {
  selectedProject: AdminCrowdfundingSelectedProject | null;
};

export function AdminCrowdfundingHeader({
  selectedProject,
}: AdminCrowdfundingHeaderProps) {
  const { t: translateUi } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          {selectedProject
            ? translateUi("Transaction History")
            : translateUi("Crowdfunding Management")}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          {selectedProject
            ? translateUi('Viewing transactions for "{0}"', {
                0: selectedProject.name,
              })
            : translateUi("Track all donations and funding progress.")}
        </p>
      </div>
    </div>
  );
}
