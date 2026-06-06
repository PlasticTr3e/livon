import { Users } from "lucide-react";
import { Badge } from "@/components/ui/primitives";

type AdminUsersHeaderProps = {
  usersCount: number;
};

export function AdminUsersHeader({ usersCount }: AdminUsersHeaderProps) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          User Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Manage citizen accounts and verification.
        </p>
      </div>
      <Badge className="flex items-center gap-1.5 border-green-300 bg-green-100 px-3 py-1.5 text-green-700">
        <Users className="h-3.5 w-3.5" /> {usersCount} Users
      </Badge>
    </div>
  );
}
