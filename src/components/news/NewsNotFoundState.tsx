import Link from "next/link";
import { Newspaper } from "lucide-react";

export function NewsNotFoundState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0B1120]">
      <Newspaper className="h-12 w-12 text-gray-300 dark:text-white" />
      <p className="font-semibold text-gray-500 dark:text-white">
        Article not found.
      </p>
      <Link
        href="/news"
        className="text-sm font-bold text-gray-900 underline dark:text-white"
      >
        Back to News
      </Link>
    </div>
  );
}
