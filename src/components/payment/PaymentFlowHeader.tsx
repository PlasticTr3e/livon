import Link from "next/link";
import type { Ref } from "react";
import type { LucideIcon } from "lucide-react";
import { FeaturePageHeader } from "@/components/shared/FeaturePageHeader";

type PaymentFlowHeaderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  headingRef?: Ref<HTMLHeadingElement>;
} & (
  | { backHref: string; backLabel: string }
  | { backHref?: never; backLabel?: never }
);

export function PaymentFlowHeader({
  title,
  description,
  icon,
  backHref,
  backLabel,
  headingRef,
}: PaymentFlowHeaderProps) {
  return (
    <header className="mx-auto max-w-lg px-4 pt-7 sm:px-5 md:pt-8">
      {backHref && (
        <Link
          href={backHref}
          className="mb-5 inline-flex min-h-11 items-center rounded text-sm font-medium text-green-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700 dark:text-green-300"
        >
          {backLabel}
        </Link>
      )}
      <FeaturePageHeader
        title={title}
        description={description}
        icon={icon}
        headingRef={headingRef}
      />
    </header>
  );
}
