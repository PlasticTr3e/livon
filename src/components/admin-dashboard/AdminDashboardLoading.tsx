import { Loader } from "lucide-react";

export function AdminDashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
      <Loader className="h-8 w-8 animate-spin text-green-600" />
    </div>
  );
}
