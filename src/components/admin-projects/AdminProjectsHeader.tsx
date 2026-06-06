import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function AdminProjectsHeader() {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
          Project Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Monitor and manage community development initiatives.
        </p>
      </div>
      <Link href="/admin/projects/create">
        <Button
          variant="primary"
          className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-6 text-xs font-bold shadow-sm hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </Link>
    </div>
  );
}
