"use client";

import { Ban, CheckCircle, Eye, Loader2 } from "lucide-react";
import { memo, useActionState, useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/AppToaster";
import { Badge, cn } from "@/components/ui/primitives";
import {
  toggleAdminUserBlock,
  verifyAdminUser,
  type AdminUserActionState,
} from "@/lib/admin-users/admin-users-actions";
import {
  getAdminUserDisplayName,
  getAdminUserRole,
  getAdminUserRoleLabel,
  getAdminUserRoleStyle,
  getAdminUserStatus,
  getAdminUserStatusStyle,
} from "@/lib/admin-users/admin-users-format";
import type { AdminUser } from "@/lib/admin-users/admin-users-types";
import { AdminUserDetailsDialog } from "./AdminUserDetailsDialog";

type AdminUsersTableProps = {
  users: AdminUser[];
};

const initialAdminUserActionState: AdminUserActionState = {
  message: "",
  status: "idle",
};

export const AdminUsersTable = memo(function AdminUsersTable({
  users,
}: AdminUsersTableProps) {
  const [verifierUserId] = useState(() => getCurrentVerifierUserId());

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
            <th className="px-8 py-4">User Details</th>
            <th className="px-4 py-4 text-center">Role</th>
            <th className="px-4 py-4 text-center">Status</th>
            <th className="px-8 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
          {users.map((user) => (
            <AdminUsersTableRow
              key={user.id}
              user={user}
              verifierUserId={verifierUserId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

const AdminUsersTableRow = memo(function AdminUsersTableRow({
  user,
  verifierUserId,
}: {
  user: AdminUser;
  verifierUserId: string;
}) {
  const toast = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [verifyState, verifyAction, isVerifying] = useActionState(
    verifyAdminUser,
    initialAdminUserActionState,
  );
  const [blockState, blockAction, isTogglingBlock] = useActionState(
    toggleAdminUserBlock,
    initialAdminUserActionState,
  );
  const role = getAdminUserRole(user);
  const status = getAdminUserStatus(user);
  const displayName = getAdminUserDisplayName(user);
  const openDetails = useCallback(() => setIsDetailsOpen(true), []);
  const closeDetails = useCallback(() => setIsDetailsOpen(false), []);

  useEffect(() => {
    if (verifyState.status === "success") {
      toast.success("Success", verifyState.message);
    }

    if (verifyState.status === "error") {
      toast.error("Verification failed", verifyState.message);
    }
  }, [toast, verifyState]);

  useEffect(() => {
    if (blockState.status === "success") {
      toast.success("Success", blockState.message);
    }

    if (blockState.status === "error") {
      toast.error("Action failed", blockState.message);
    }
  }, [blockState, toast]);

  return (
    <tr className="group transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20">
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getAdminUserRoleStyle(role)}`}
          >
            {displayName.charAt(0)}
          </div>
          <div>
            <span className="block text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
              {displayName}
            </span>
            <span className="mt-1 block text-[11px] font-medium text-gray-400 dark:text-white">
              {user.email}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-[10px] font-semibold ${getAdminUserRoleStyle(role)}`}
          >
            {getAdminUserRoleLabel(role)}
          </span>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <Badge
            className={`rounded-full px-4 py-1 text-[10px] font-semibold ${getAdminUserStatusStyle(status)}`}
          >
            {status}
          </Badge>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={openDetails}
            className="rounded-xl border border-gray-100 bg-white p-2.5 text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white dark:border-gray-800 dark:bg-[#1F2937] dark:text-blue-400 dark:hover:bg-blue-700"
            title="View user"
          >
            <Eye className="h-4 w-4" />
          </button>

          {isDetailsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <button
                type="button"
                aria-label="Close user details"
                className="absolute inset-0 bg-black/40"
                onClick={closeDetails}
              />
              <div className="relative z-10">
                <AdminUserDetailsDialog role={role} user={user} />
              </div>
            </div>
          )}

          {status === "Pending" && (
            <form action={verifyAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="verifierUserId"
                value={verifierUserId}
              />
              <ActionIconButton
                disabled={isVerifying}
                title="Verify user"
                className="text-green-600 hover:bg-green-600 dark:text-green-400 dark:hover:bg-green-700"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </ActionIconButton>
            </form>
          )}
          {role === "resident" && (
            <form action={blockAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="isBlocked"
                value={status === "Blocked" ? "true" : "false"}
              />
              <ActionIconButton
                disabled={isTogglingBlock}
                title={status === "Blocked" ? "Unblock User" : "Block User"}
                className={cn(
                  "text-red-500 hover:bg-red-500 dark:text-red-400 dark:hover:bg-red-600",
                  status === "Blocked" && "bg-red-50 dark:bg-red-900/30",
                )}
              >
                <Ban className="h-4 w-4" />
              </ActionIconButton>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
});

function getCurrentVerifierUserId() {
  if (typeof window === "undefined") return "";

  const token = localStorage.getItem("livon-token");
  if (!token) return "";

  try {
    const [, payload] = token.split(".");
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );
    const decodedPayload = JSON.parse(atob(paddedPayload)) as {
      userId?: string;
    };
    return decodedPayload.userId || "";
  } catch {
    return "";
  }
}

const ActionIconButton = memo(function ActionIconButton({
  children,
  className,
  disabled,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-[#1F2937]",
        className,
      )}
    >
      {children}
    </button>
  );
});
