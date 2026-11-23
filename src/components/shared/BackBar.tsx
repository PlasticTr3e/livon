import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BackBarProps = { label: string } & (
  | { href: string; onBack?: never }
  | { href?: never; onBack: () => void }
);

const backControlClass =
  "inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-green-700 hover:text-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:text-green-400 dark:hover:text-green-300";

export function BackBar({ label, href, onBack }: BackBarProps) {
  const content = (
    <>
      <ArrowLeft aria-hidden="true" className="size-5 shrink-0" />
      <span>{label}</span>
    </>
  );

  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center border-b border-gray-200 bg-white px-4 py-0.5 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      {href ? (
        <Link href={href} className={backControlClass}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={backControlClass}>
          {content}
        </button>
      )}
    </div>
  );
}
