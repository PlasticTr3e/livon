import { AdminUsersPageContent } from "@/components/admin-users/AdminUsersPageContent";
import type { AdminUsersSearchParams } from "@/lib/admin-users/admin-users-types";

type UsersPageProps = {
  searchParams?: Promise<AdminUsersSearchParams>;
};

export default async function UserManagementPage({
  searchParams,
}: UsersPageProps) {
  return <AdminUsersPageContent searchParams={await searchParams} />;
}
