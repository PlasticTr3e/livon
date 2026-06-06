type CrowdfundingLoadingStateProps = {
  label: string;
};

export function CrowdfundingLoadingState({
  label,
}: CrowdfundingLoadingStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-600 dark:border-slate-600" />
        <p className="font-medium text-gray-500 dark:text-white">{label}</p>
      </div>
    </div>
  );
}
