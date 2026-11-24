import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { FEATURE_CARD_SURFACE } from "@/lib/ui/feature-styles";

export function FeatureCard({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={twMerge(FEATURE_CARD_SURFACE, "p-5 sm:p-6", className)}
    >
      {children}
    </div>
  );
}
