import { Loader2, Leaf } from "lucide-react";
import { cn } from "@/components/ui/primitives";

type LoadingStateVariant = "page" | "panel" | "inline";

type LoadingStateProps = {
  label?: string;
  className?: string;
  variant?: LoadingStateVariant;
};

export function LoadingState({
  label = "Loading...",
  className,
  variant = "page",
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-green-600" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-50 text-center dark:bg-[#0B1120]",
        variant === "page" ? "min-h-full p-6" : "min-h-40 rounded-2xl p-6",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-green-100 shadow-sm dark:bg-green-900/30" />
          <div className="absolute inset-0 animate-ping rounded-2xl bg-green-400/20" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/20">
            <Leaf className="h-5 w-5" />
          </div>
          <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin rounded-full bg-white text-green-600 dark:bg-[#111827]" />
        </div>
        <p className="text-sm font-bold text-gray-600 dark:text-white">
          {label}
        </p>
      </div>
    </div>
  );
}
