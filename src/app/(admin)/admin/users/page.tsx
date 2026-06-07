import { AdminUsersPageContent } from "@/components/admin-users/AdminUsersPageContent";
import { getAdminUsersPageData } from "@/lib/admin-users/admin-users-data";
import type { AdminUsersSearchParams } from "@/lib/admin-users/admin-users-types";

type UsersPageProps = {
  searchParams?: Promise<AdminUsersSearchParams>;
};

export default async function UserManagementPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;
  const { filters, users } = await getAdminUsersPageData(params);

  return <AdminUsersPageContent filters={filters} users={users} />;
}
