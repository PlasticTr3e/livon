import { Badge } from "@/components/ui/primitives";
import {
  getAdminUserAddress,
  getAdminUserDisplayName,
  getAdminUserPhone,
  getAdminUserRoleStyle,
  getAdminUserStatus,
  getAdminUserStatusStyle,
} from "@/lib/admin-users/admin-users-format";
import type {
  AdminUser,
  AdminUserRole,
} from "@/lib/admin-users/admin-users-types";

type AdminUserDetailsDialogProps = {
  role: AdminUserRole;
  user: AdminUser;
};

export function AdminUserDetailsDialog({
  role,
  user,
}: AdminUserDetailsDialogProps) {
  const displayName = getAdminUserDisplayName(user);
  const address = getAdminUserAddress(user);
  const status = getAdminUserStatus(user);

  return (
    <div className="pointer-events-auto w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-left shadow-2xl dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {displayName}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-white">
            {user.email}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getAdminUserRoleStyle(role)}`}
        >
          {role}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <AdminUserDetailField label="Status">
          <Badge className={`mt-2 text-xs ${getAdminUserStatusStyle(status)}`}>
            {status}
          </Badge>
        </AdminUserDetailField>
        <AdminUserDetailField label="Phone">
          <p className="mt-2 font-semibold text-gray-800 dark:text-white">
            {getAdminUserPhone(user)}
          </p>
        </AdminUserDetailField>
        <AdminUserDetailField className="sm:col-span-2" label="Address">
          <p className="mt-2 font-semibold text-gray-800 dark:text-white">
            {address}
          </p>
        </AdminUserDetailField>
        {role === "resident" && (
          <>
            <AdminUserDetailField label="NIK">
              <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                {user.citizenProfile?.nik || "-"}
              </p>
            </AdminUserDetailField>
            <AdminUserDetailField label="KK">
              <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                {user.citizenProfile?.kkNumber || "-"}
              </p>
            </AdminUserDetailField>
          </>
        )}
      </div>
    </div>
  );
}

function AdminUserDetailField({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-[#111827]/50 ${className ?? ""}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
        {label}
      </p>
      {children}
    </div>
  );
}
