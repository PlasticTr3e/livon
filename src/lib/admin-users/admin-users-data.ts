import { Role } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import {
  filterAdminUsers,
  normalizeAdminUserFilters,
} from "./admin-users-format";
import type { AdminUsersSearchParams } from "./admin-users-types";

export async function getAdminUsersPageData(
  searchParams?: AdminUsersSearchParams,
) {
  const filters = normalizeAdminUserFilters(searchParams);
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.WARGA, Role.AGENCY],
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      deletedAt: true,
      citizenProfile: {
        select: {
          fullName: true,
          blockHouse: true,
          isVerified: true,
          phone: true,
          nik: true,
          kkNumber: true,
        },
      },
      agencyProfile: {
        select: {
          agencyName: true,
          address: true,
          isVerified: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    filters,
    users: filterAdminUsers(users, filters),
  };
}
