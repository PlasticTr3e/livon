import { Ban, CheckCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import {
  toggleAdminUserBlock,
  verifyAdminUser,
} from "@/lib/admin-users/admin-users-actions";
import {
  getAdminUserAddress,
  getAdminUserDisplayName,
  getAdminUserRole,
  getAdminUserRoleStyle,
  getAdminUserStatus,
  getAdminUserStatusStyle,
} from "@/lib/admin-users/admin-users-format";
import type { AdminUser } from "@/lib/admin-users/admin-users-types";
import { AdminUserDetailsDialog } from "./AdminUserDetailsDialog";

type AdminUsersTableProps = {
  users: AdminUser[];
};

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm md:min-w-0">
        <thead>
          <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-white">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">House Number / Address</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
          {users.map((user) => (
            <AdminUsersTableRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminUsersTableRow({ user }: { user: AdminUser }) {
  const role = getAdminUserRole(user);
  const status = getAdminUserStatus(user);
  const displayName = getAdminUserDisplayName(user);
  const address = getAdminUserAddress(user);

  return (
    <tr className="transition-colors hover:bg-green-50 dark:hover:bg-green-900/10">
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAdminUserRoleStyle(role)}`}
          >
            {displayName.charAt(0)}
          </div>
          <div>
            <span className="block font-semibold text-gray-900 dark:text-white">
              {displayName}
            </span>
            <span className="text-xs text-gray-400 dark:text-white">
              {user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-gray-600 dark:text-white">{address}</td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getAdminUserRoleStyle(role)}`}
        >
          {role}
        </span>
      </td>
      <td className="px-4 py-4">
        <Badge className={`text-xs ${getAdminUserStatusStyle(status)}`}>
          {status}
        </Badge>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <details className="group">
            <summary className="cursor-pointer list-none rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600 group-open:fixed group-open:inset-0 group-open:z-40 group-open:bg-black/40 group-open:p-0 group-open:hover:bg-black/40">
              <Eye className="h-4 w-4" />
            </summary>
            <div className="pointer-events-none fixed inset-0 z-50 hidden p-6 group-open:flex group-open:items-center group-open:justify-center">
              <AdminUserDetailsDialog role={role} user={user} />
            </div>
          </details>

          {status === "Pending" && (
            <form action={verifyAdminUser}>
              <input type="hidden" name="userId" value={user.id} />
              <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-green-600 transition-colors hover:bg-green-50">
                <CheckCircle className="h-3.5 w-3.5" /> Verifikasi
              </button>
            </form>
          )}
          {role === "resident" && (
            <form action={toggleAdminUserBlock}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="isBlocked"
                value={status === "Blocked" ? "true" : "false"}
              />
              <button
                className={`rounded-lg p-1.5 transition-colors ${
                  status === "Blocked"
                    ? "bg-red-50 text-red-600 dark:bg-red-900/30"
                    : "text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                }`}
                title={status === "Blocked" ? "Unblock User" : "Block User"}
              >
                <Ban className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
