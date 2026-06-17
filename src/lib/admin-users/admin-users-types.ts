export type AdminUserRole = "agency" | "resident";

export type AdminUserStatus = "Verified" | "Pending" | "Blocked";

export type AdminUsersSearchParams = {
  filter?: string;
  search?: string;
  role?: string;
  status?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: string | null;
  deletedAt?: Date | string | null;
  citizenProfile?: {
    fullName: string | null;
    blockHouse: string | null;
    houseNumber: string | null;
    isVerified: boolean;
    phone: string | null;
    nik: string | null;
    kkNumber: string | null;
  } | null;
  agencyProfile?: {
    agencyName: string | null;
    address: string | null;
    isVerified: boolean;
    phone: string | null;
  } | null;
};

export type AdminUserFilters = {
  filter: string;
  role: string;
  search: string;
  status: string;
};
