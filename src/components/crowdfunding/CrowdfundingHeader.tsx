import { HandCoins, Search } from "lucide-react";

type CrowdfundingHeaderProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export function CrowdfundingHeader({
  searchQuery,
  onSearchChange,
}: CrowdfundingHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 border-b border-gray-200 pb-6 dark:border-gray-800 md:flex-row md:items-end">
      <div>
        <div className="mb-2.5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
            <HandCoins className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Crowdfunding
          </h1>
        </div>
        <p className="ml-[52px] max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-300">
          Help create a better environment by donating to ongoing community
          projects.
        </p>
      </div>

      <div className="relative w-full shrink-0 md:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search campaigns..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-slate-800 dark:bg-[#111827] dark:text-white dark:placeholder:text-slate-500"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
}
