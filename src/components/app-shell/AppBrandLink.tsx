import Link from "next/link";
import { Leaf } from "lucide-react";

type AppBrandLinkProps = {
  href: string;
};

export function AppBrandLink({ href }: AppBrandLinkProps) {
  return (
    <Link href={href} className="group flex shrink-0 items-center space-x-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-700 shadow-md transition-shadow group-hover:shadow-green-300 dark:group-hover:shadow-green-900">
        <Leaf className="h-4 w-4 text-white" />
      </div>
      <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-xl font-black tracking-widest text-transparent dark:from-green-400 dark:to-green-500">
        LIVON
      </span>
    </Link>
  );
}
