import { Suspense } from "react";
import { ProjectDetailPageContent } from "@/components/project-detail/ProjectDetailPageContent";

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        </div>
      }
    >
      <ProjectDetailPageContent />
    </Suspense>
  );
}
