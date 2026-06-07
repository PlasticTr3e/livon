import { Input } from "@/components/ui/primitives";
import { AdminCrowdfundingTransactionsTable } from "@/components/admin-crowdfunding/AdminCrowdfundingTransactionsTable";
import type {
  AdminCrowdfundingTransaction,
  AdminCrowdfundingTransactionSort,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-types";
import { AlertCircle, ArrowRightLeft, Search } from "lucide-react";

type AdminCrowdfundingProjectTransactionsViewProps = {
  transactions: AdminCrowdfundingTransaction[];
  searchQuery: string;
  sort: AdminCrowdfundingTransactionSort;
  onSearchChange: (searchQuery: string) => void;
  onSortChange: (sort: AdminCrowdfundingTransactionSort) => void;
};

export function AdminCrowdfundingProjectTransactionsView({
  transactions,
  searchQuery,
  sort,
  onSearchChange,
  onSortChange,
}: AdminCrowdfundingProjectTransactionsViewProps) {
  return (
    <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm dark:bg-slate-900">
      <div className="mb-5 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white" />
          <Input
            className="w-full border-green-200 pl-9"
            placeholder="Search donor or TRX ID..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              value={sort}
              onChange={(event) =>
                onSortChange(
                  event.target.value as AdminCrowdfundingTransactionSort,
                )
              }
              className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-green-200 bg-white pl-10 pr-8 text-sm font-bold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500/50 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white"
            >
              <option value="latest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-green-600">
              <ArrowRightLeft className="h-4 w-4 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="py-16 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500 dark:text-white">
            No transactions found for this project.
          </p>
        </div>
      ) : (
        <AdminCrowdfundingTransactionsTable
          transactions={transactions}
          emptyMessage="No transactions found for this project."
          showTransactionId
        />
      )}
    </div>
  );
}
