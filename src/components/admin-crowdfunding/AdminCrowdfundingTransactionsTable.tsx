import { Badge, Card, cn } from "@/components/ui/primitives";
import {
  formatAdminCrowdfundingAmount,
  getAdminDonationStatusClass,
} from "@/lib/admin-crowdfunding/admin-crowdfunding-format";
import type { AdminCrowdfundingTransaction } from "@/lib/admin-crowdfunding/admin-crowdfunding-types";

type AdminCrowdfundingTransactionsTableProps = {
  transactions: AdminCrowdfundingTransaction[];
  emptyMessage: string;
  showProject?: boolean;
  showTransactionId?: boolean;
  limit?: number;
};

export function AdminCrowdfundingTransactionsTable({
  transactions,
  emptyMessage,
  showProject = false,
  showTransactionId = false,
  limit,
}: AdminCrowdfundingTransactionsTableProps) {
  const visibleTransactions = limit
    ? transactions.slice(0, limit)
    : transactions;

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
            {showTransactionId && <th className="px-8 py-4">TRX ID</th>}
            <th className="px-8 py-4">Donor</th>
            {showProject && <th className="px-4 py-4">Project</th>}
            <th className="px-4 py-4">Amount</th>
            <th className="px-4 py-4">Time</th>
            <th className="px-8 py-4 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {visibleTransactions.length > 0 ? (
            visibleTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                showProject={showProject}
                showTransactionId={showTransactionId}
              />
            ))
          ) : (
            <tr>
              <td
                colSpan={getColumnCount(showProject, showTransactionId)}
                className="py-24 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-white"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminCrowdfundingRecentTransactions({
  transactions,
}: {
  transactions: AdminCrowdfundingTransaction[];
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
      </div>

      <AdminCrowdfundingTransactionsTable
        transactions={transactions}
        emptyMessage="No transaction data yet"
        showProject
        limit={3}
      />
    </Card>
  );
}

function TransactionRow({
  transaction,
  showProject,
  showTransactionId,
}: {
  transaction: AdminCrowdfundingTransaction;
  showProject: boolean;
  showTransactionId: boolean;
}) {
  return (
    <tr className="group transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20">
      {showTransactionId && (
        <td className="px-8 py-6 font-mono text-[11px] font-semibold text-gray-500 dark:text-white">
          {transaction.id}
        </td>
      )}
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
            {transaction.user}
          </span>
          {!showTransactionId && (
            <span className="mt-1 font-mono text-[11px] font-medium text-gray-400 dark:text-white">
              {transaction.id}
            </span>
          )}
        </div>
      </td>
      {showProject && (
        <td className="px-4 py-6 text-xs font-semibold text-gray-600 dark:text-white">
          {transaction.project}
        </td>
      )}
      <td className="px-4 py-6 text-xs font-black text-green-700 dark:text-green-400">
        Rp {formatAdminCrowdfundingAmount(transaction.amount)}
      </td>
      <td className="px-4 py-6 text-xs font-semibold text-gray-500 dark:text-white">
        {transaction.date}
      </td>
      <td className="px-8 py-6">
        <div className="flex justify-center">
          <Badge
            className={cn(
              "rounded-full px-4 py-1 text-[10px] font-semibold",
              getAdminDonationStatusClass(transaction.status),
            )}
          >
            {transaction.status}
          </Badge>
        </div>
      </td>
    </tr>
  );
}

function getColumnCount(showProject: boolean, showTransactionId: boolean) {
  return 4 + Number(showProject) + Number(showTransactionId);
}
