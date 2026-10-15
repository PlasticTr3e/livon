import { ArrowLeft } from "lucide-react";

type CommunityBackBarProps = {
  onBack: () => void;
};

export function CommunityBackBar({ onBack }: CommunityBackBarProps) {
  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <button
        type="button"
        onClick={onBack}
        className="-my-1 flex items-center rounded-md py-1 text-green-600 transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-green-400"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        <span className="text-sm font-medium">Kembali ke Komunitas</span>
      </button>
    </div>
  );
}
