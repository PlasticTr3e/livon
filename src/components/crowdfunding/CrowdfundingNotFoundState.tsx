import Link from "next/link";

export function CrowdfundingNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <div className="text-center">
        <p className="font-medium text-gray-500 dark:text-white">
          Campaign not found
        </p>
        <Link
          href="/crowdfunding"
          className="mt-2 inline-block text-green-600 hover:text-green-700"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
