import { CircleAlert, RotateCw } from "lucide-react";
import { cn } from "@/components/ui/primitives";

type FinanceLoadErrorProps = {
  message: string;
  onRetry: () => void;
  className?: string;
};

/** Inline error with a retry button for a failed finance API request. */
export function FinanceLoadError({
  message,
  onRetry,
  className,
}: FinanceLoadErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <RotateCw aria-hidden="true" className="h-4 w-4" />
        Coba lagi
      </button>
    </div>
  );
}
