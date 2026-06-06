import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PaymentTopBarProps = {
  backHref?: string;
  label: string;
  onBack?: () => void;
};

export function PaymentTopBar({ backHref, label, onBack }: PaymentTopBarProps) {
  const className =
    "flex items-center text-green-600 transition-colors hover:text-green-800 dark:text-green-400";
  const content = (
    <>
      <ArrowLeft className="mr-2 h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </>
  );

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-[#111827]">
      {backHref ? (
        <Link href={backHref} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onBack} className={className}>
          {content}
        </button>
      )}
    </div>
  );
}
