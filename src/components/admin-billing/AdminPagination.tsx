import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  /** Noun for the count, e.g. "tagihan" or "transaksi". */
  unit: string;
  onPageChange: (page: number) => void;
};

const pageButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-700 dark:hover:bg-slate-800";

export function AdminPagination({
  page,
  totalPages,
  total,
  unit,
  onPageChange,
}: AdminPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <span>
        {total} {unit} · halaman {page} dari {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className={pageButtonClass}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
          className={pageButtonClass}
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
