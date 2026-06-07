import { LoadingState } from "@/components/shared/LoadingState";

type CrowdfundingLoadingStateProps = {
  label: string;
};

export function CrowdfundingLoadingState({
  label,
}: CrowdfundingLoadingStateProps) {
  return <LoadingState label={label} className="h-full" />;
}
