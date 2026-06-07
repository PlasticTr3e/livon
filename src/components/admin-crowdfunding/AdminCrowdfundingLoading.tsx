import { LoadingState } from "@/components/shared/LoadingState";

export function AdminCrowdfundingLoading() {
  return (
    <LoadingState label="Loading crowdfunding data..." className="min-h-full" />
  );
}
