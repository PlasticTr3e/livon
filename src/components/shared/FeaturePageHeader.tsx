import type { ReactNode, Ref } from "react";
import type { LucideIcon } from "lucide-react";

type FeaturePageHeaderProps = {
  title: string;
  description: ReactNode;
  icon: LucideIcon;
  children?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement>;
};

export function FeaturePageHeader({
  title,
  description,
  icon: Icon,
  children,
  headingRef,
}: FeaturePageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-5 border-b border-gray-200 pb-6 dark:border-gray-800 md:flex-row md:items-end">
      <div className="min-w-0">
        <div className="mb-2.5 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
            <Icon aria-hidden="true" className="h-5 w-5 text-white" />
          </span>
          <h1
            ref={headingRef}
            tabIndex={headingRef ? -1 : undefined}
            className="text-2xl font-black tracking-tight text-gray-900 outline-none sm:text-3xl dark:text-white"
          >
            {title}
          </h1>
        </div>
        <div className="ml-14 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </div>
      </div>
      {children && <div className="w-full shrink-0 md:w-auto">{children}</div>}
    </div>
  );
}
