import { Card } from "@/components/ui/primitives";
import type {
  AdminUser,
  AdminUserFilters,
} from "@/lib/admin-users/admin-users-types";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUsersHeader } from "./AdminUsersHeader";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminUsersPageContentProps = {
  filters: AdminUserFilters;
  users: AdminUser[];
};

export function AdminUsersPageContent({
  filters,
  users,
}: AdminUsersPageContentProps) {
  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
      <AdminUsersHeader usersCount={users.length} />

      <Card className="border-green-100 p-5 shadow-sm dark:border-gray-800">
        <AdminUsersFilters filters={filters} />
        <AdminUsersTable users={users} />
      </Card>
    </div>
  );
}
