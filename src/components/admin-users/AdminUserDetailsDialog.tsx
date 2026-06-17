import { Badge } from "@/components/ui/primitives";
import {
  getAdminUserAddress,
  getAdminUserDisplayName,
  getAdminUserPhone,
  getAdminUserRoleLabel,
  getAdminUserRoleStyle,
  getAdminUserStatus,
  getAdminUserStatusStyle,
} from "@/lib/admin-users/admin-users-format";
import type {
  AdminUser,
  AdminUserRole,
} from "@/lib/admin-users/admin-users-types";
import { X } from "lucide-react";

type AdminUserDetailsDialogProps = {
  onClose?: () => void;
  role: AdminUserRole;
  user: AdminUser;
};

export function AdminUserDetailsDialog({
  onClose,
  role,
  user,
}: AdminUserDetailsDialogProps) {
  const displayName = getAdminUserDisplayName(user);
  const address = getAdminUserAddress(user);
  const status = getAdminUserStatus(user);

  return (
    <div className="pointer-events-auto flex max-h-[calc(100dvh-8rem)] w-full max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-2xl dark:border-gray-800 dark:bg-[#1F2937] sm:max-h-[calc(100dvh-4rem)] sm:max-w-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-8 sm:py-6">
        <div className="min-w-0">
          <p className="truncate text-xl font-black text-gray-900 dark:text-white sm:text-2xl">
            {displayName}
          </p>
          <p className="mt-1 truncate text-sm text-gray-500 dark:text-white">
            {user.email}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getAdminUserRoleStyle(role)}`}
          >
            {getAdminUserRoleLabel(role)}
          </span>
          {onClose && (
            <button
              type="button"
              aria-label="Close user details"
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto px-5 py-5 text-sm sm:grid-cols-2 sm:gap-4 sm:px-8 sm:py-6">
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
      className={`rounded-xl border border-gray-100 bg-slate-50 p-4 dark:border-gray-800 dark:bg-[#111827]/50 ${className ?? ""}`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
        {label}
      </p>
      {children}
    </div>
  );
}
