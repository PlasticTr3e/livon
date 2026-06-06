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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-white">
            {showTransactionId && <th className="px-4 py-3">TRX ID</th>}
            <th className="px-4 py-3">Donor</th>
            {showProject && <th className="px-4 py-3">Project</th>}
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
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
                className="py-6 text-center text-sm text-gray-500 dark:text-white"
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
    <Card className="border-gray-200 p-6 shadow-sm dark:border-gray-800">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">
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
    <tr className="transition-colors hover:bg-green-50">
      {showTransactionId && (
        <td className="px-4 py-3.5 font-mono text-xs text-gray-500 dark:text-white">
          {transaction.id}
        </td>
      )}
      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">
        {transaction.user}
      </td>
      {showProject && (
        <td className="px-4 py-3 text-xs text-gray-600 dark:text-white">
          {transaction.project}
        </td>
      )}
      <td className="px-4 py-3 font-black text-green-700">
        Rp {formatAdminCrowdfundingAmount(transaction.amount)}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-white">
        {transaction.date}
      </td>
      <td className="px-4 py-3">
        <Badge
          className={cn(
            "text-[10px]",
            getAdminDonationStatusClass(transaction.status),
          )}
        >
          {transaction.status}
        </Badge>
      </td>
    </tr>
  );
}

function getColumnCount(showProject: boolean, showTransactionId: boolean) {
  return 4 + Number(showProject) + Number(showTransactionId);
}
