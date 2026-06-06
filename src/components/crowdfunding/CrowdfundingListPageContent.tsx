"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchCrowdfundingProjects,
  getStoredCrowdfundingToken,
} from "@/lib/crowdfunding/crowdfunding-api";
import { filterCrowdfundingProjects } from "@/lib/crowdfunding/crowdfunding-format";
import type { CrowdfundingProject } from "@/lib/crowdfunding/crowdfunding-types";
import { CrowdfundingCampaignList } from "./CrowdfundingCampaignList";
import { CrowdfundingHeader } from "./CrowdfundingHeader";

export function CrowdfundingListPageContent() {
  const [projects, setProjects] = useState<CrowdfundingProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setIsLoading(true);
        const nextProjects = await fetchCrowdfundingProjects(
          getStoredCrowdfundingToken(),
        );
        setProjects(nextProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, []);

  const filteredProjects = useMemo(
    () => filterCrowdfundingProjects(projects, searchQuery),
    [projects, searchQuery],
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">
        <CrowdfundingHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <CrowdfundingCampaignList
          isLoading={isLoading}
          projects={filteredProjects}
        />
      </div>
    </div>
  );
}
