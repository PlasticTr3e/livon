import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";

const tones = {
  warning:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-300",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300",
} as const;

type PaymentNoticeProps = {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
};

/** Slim banner for the countdown, pending status, and login hints. */
export function PaymentNotice({
  icon: Icon,
  tone = "warning",
  children,
  className,
}: PaymentNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center text-sm",
        tones[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
