import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

type CrowdfundingDetailTopBarProps = {
  projectId: string;
};

export function CrowdfundingDetailTopBar({
  projectId,
}: CrowdfundingDetailTopBarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      <Link
        href="/crowdfunding"
        className="flex items-center text-green-600 transition-colors hover:text-green-800 dark:text-green-400"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        <span className="text-sm font-medium">Back to Menu</span>
      </Link>
      <Link
        href={`/project/${projectId}`}
        className="flex items-center text-green-600 transition-colors hover:text-green-800 dark:text-green-400"
      >
        <span className="text-sm font-medium">View Project Details</span>
        <ChevronRight className="ml-1 h-5 w-5" />
      </Link>
    </div>
  );
}
