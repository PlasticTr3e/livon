"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  fetchCrowdfundingProject,
  getStoredCrowdfundingToken,
} from "@/lib/crowdfunding/crowdfunding-api";
import {
  CROWDFUNDING_PRESET_AMOUNTS,
  getCrowdfundingImages,
  getCrowdfundingProjectStats,
} from "@/lib/crowdfunding/crowdfunding-format";
import type { CrowdfundingProject } from "@/lib/crowdfunding/crowdfunding-types";
import { CrowdfundingDetailTopBar } from "./CrowdfundingDetailTopBar";
import { CrowdfundingDonationForm } from "./CrowdfundingDonationForm";
import { CrowdfundingImageGallery } from "./CrowdfundingImageGallery";
import { CrowdfundingLoadingState } from "./CrowdfundingLoadingState";
import { CrowdfundingNotFoundState } from "./CrowdfundingNotFoundState";
import { CrowdfundingProjectOverview } from "./CrowdfundingProjectOverview";

export function CrowdfundingDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<CrowdfundingProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        setIsLoading(true);
        const nextProject = await fetchCrowdfundingProject(
          id,
          getStoredCrowdfundingToken(),
        );
        setProject(nextProject);
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) loadProject();
  }, [id]);

  if (isLoading) {
    return <CrowdfundingLoadingState label="Loading campaign..." />;
  }

  if (!project) {
    return <CrowdfundingNotFoundState />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <CrowdfundingDetailTopBar projectId={project.id} />

      <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <CrowdfundingImageGallery
            images={getCrowdfundingImages(project)}
            title={project.title}
          />
          <CrowdfundingProjectOverview
            project={project}
            stats={getCrowdfundingProjectStats(project)}
          />
        </div>

        <CrowdfundingDonationForm
          project={project}
          presetAmounts={CROWDFUNDING_PRESET_AMOUNTS}
        />
      </div>
    </div>
  );
}
