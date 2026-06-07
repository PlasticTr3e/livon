import { Suspense } from "react";
import { ProjectDetailPageContent } from "@/components/project-detail/ProjectDetailPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <LoadingState label="Loading project..." className="h-screen" />
      }
    >
      <ProjectDetailPageContent />
    </Suspense>
  );
}
