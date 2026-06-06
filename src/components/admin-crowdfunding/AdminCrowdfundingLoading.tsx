export function AdminCrowdfundingLoading() {
  return (
    <div className="flex min-h-full items-center justify-center space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-600" />
        <p className="font-medium text-gray-500 dark:text-white">
          Loading data...
        </p>
      </div>
    </div>
  );
}
