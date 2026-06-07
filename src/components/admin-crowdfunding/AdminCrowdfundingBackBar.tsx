import { ArrowLeft } from "lucide-react";

type AdminCrowdfundingBackBarProps = {
  onBack: () => void;
};

export function AdminCrowdfundingBackBar({
  onBack,
}: AdminCrowdfundingBackBarProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-green-600 transition-colors hover:text-green-800 dark:text-green-400"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>
    </div>
  );
}
