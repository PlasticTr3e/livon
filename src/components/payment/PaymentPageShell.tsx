import type { ReactNode } from "react";
import { cn } from "@/components/ui/primitives";

const widthClasses = {
  narrow: "max-w-lg",
  default: "max-w-4xl",
  wide: "max-w-6xl",
} as const;

export type PaymentPageWidth = keyof typeof widthClasses;

export function getPaymentWidthClass(width: PaymentPageWidth) {
  return widthClasses[width];
}

type PaymentPageShellProps = {
  header?: ReactNode;
  children: ReactNode;
  width?: PaymentPageWidth;
  className?: string;
};

/** Scroll container + centered content column for every payment page. */
export function PaymentPageShell({
  header,
  children,
  width = "default",
  className,
}: PaymentPageShellProps) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950">
      {header}
      <div
        className={cn(
          "mx-auto w-full px-4 py-6 sm:px-5 md:py-10",
          widthClasses[width],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
