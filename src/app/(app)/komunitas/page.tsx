import { Suspense } from "react";
import { CommunityPageContent } from "@/components/community/CommunityPageContent";
import { LoadingState } from "@/components/shared/LoadingState";

export default function KomunitasPage() {
  return (
    <Suspense fallback={<LoadingState label="Memuat komunitas..." />}>
      <CommunityPageContent />
    </Suspense>
  );
}
