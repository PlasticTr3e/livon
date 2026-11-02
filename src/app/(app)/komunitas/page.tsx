import { Suspense } from "react";
import { CommunityPageContent } from "@/components/community/CommunityPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function CommunityPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading Community..." />}>
      <CommunityPageContent />
    </Suspense>
  );
}
