"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { UiText } from "@/context/LanguageContext";
import { LoadingState } from "@/components/shared/LoadingState";
import type {
  AdminUser,
  AdminUserFilters,
  AdminUsersSearchParams,
} from "@/lib/admin-users/admin-users-types";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUsersHeader } from "./AdminUsersHeader";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminUsersPageContentProps = {
  searchParams?: AdminUsersSearchParams;
};

export function AdminUsersPageContent({
  searchParams,
}: AdminUsersPageContentProps) {
  const query = new URLSearchParams(
    Object.entries(searchParams ?? {}),
  ).toString();
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);
  const [data, setData] = useState<{
    filters: AdminUserFilters;
    users: AdminUser[];
  }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/users?${query}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("livon-token") ?? ""}`,
      },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load users");
        return response.json();
      })
      .then((result) => {
        setData(result);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [query, revision]);

  if (failed)
    return (
      <p className="p-6">
        <UiText>Failed to load users</UiText>
      </p>
    );
  if (!data) return <LoadingState />;
  const { filters, users } = data;
  return (
    <div className="min-h-full space-y-6 bg-slate-50 p-6 dark:bg-[#0B1120] md:p-8">
      <AdminUsersHeader usersCount={users.length} />

      <Card className="border-green-100 p-5 shadow-sm dark:border-gray-800">
        <AdminUsersFilters filters={filters} />
        <AdminUsersTable users={users} onChange={refresh} />
      </Card>
    </div>
  );
}
