import type {
  AdminUser,
  AdminUserFilters,
  AdminUserRole,
  AdminUserStatus,
} from "./admin-users-types";

export function getAdminUserRole(
  user: Pick<AdminUser, "role" | "agencyProfile">,
): AdminUserRole {
  return user.role?.toUpperCase() === "AGENCY" || user.agencyProfile
    ? "agency"
    : "resident";
}

export function getAdminUserRoleLabel(role: AdminUserRole) {
  return role === "agency" ? "Agency" : "Resident";
}

export function getAdminUserStatus(
  user: Pick<AdminUser, "deletedAt" | "agencyProfile" | "citizenProfile">,
): AdminUserStatus {
  if (user.deletedAt) return "Blocked";
  if (user.agencyProfile) {
    return user.agencyProfile.isVerified ? "Verified" : "Pending";
  }
  if (user.citizenProfile) {
    return user.citizenProfile.isVerified ? "Verified" : "Pending";
  }
  return "Pending";
}

export function getAdminUserDisplayName(user: AdminUser) {
  return (
    user.citizenProfile?.fullName ||
    user.agencyProfile?.agencyName ||
    user.email
  );
}

export function getAdminUserAddress(user: AdminUser) {
  return user.citizenProfile?.blockHouse || user.agencyProfile?.address || "-";
}

export function getAdminUserPhone(user: AdminUser) {
  return user.citizenProfile?.phone || user.agencyProfile?.phone || "-";
}

export function getAdminUserStatusStyle(status: string) {
  switch (status) {
    case "Verified":
      return "bg-green-100 text-green-700 border-green-300";
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "Blocked":
      return "bg-red-100 text-red-600 border-red-300";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function getAdminUserRoleStyle(role: string) {
  switch (role) {
    case "agency":
      return "text-blue-700 bg-blue-50 border border-blue-300";
    default:
      return "text-green-700 bg-green-50 border border-green-300";
  }
}

export function normalizeAdminUserFilters(searchParams?: {
  filter?: string;
  search?: string;
  role?: string;
  status?: string;
}): AdminUserFilters {
  const legacyRole = searchParams?.role || "ALL";
  const legacyStatus = searchParams?.status || "ALL";

  return {
    filter:
      searchParams?.filter ||
      (legacyRole !== "ALL" ? legacyRole : legacyStatus) ||
      "ALL",
    search: searchParams?.search?.trim() || "",
    role: legacyRole,
    status: legacyStatus,
  };
}

export function filterAdminUsers(
  users: AdminUser[],
  filters: AdminUserFilters,
) {
  const normalizedSearch = filters.search.toLowerCase();

  return users.filter((user) => {
    const role = getAdminUserRole(user);
    const status = getAdminUserStatus(user);
    const matchesFilter = getAdminUserFilterMatch(filters.filter, role, status);
    const matchesSearch =
      !normalizedSearch ||
      user.email.toLowerCase().includes(normalizedSearch) ||
      user.citizenProfile?.fullName?.toLowerCase().includes(normalizedSearch) ||
      user.citizenProfile?.blockHouse
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      user.agencyProfile?.agencyName
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      user.agencyProfile?.address?.toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });
}

function getAdminUserFilterMatch(
  filter: string,
  role: AdminUserRole,
  status: AdminUserStatus,
) {
  if (filter === "ALL") return true;
  if (filter === "resident" || filter === "agency") return role === filter;
  return status === filter;
}
