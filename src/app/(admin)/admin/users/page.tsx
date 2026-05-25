import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Script from "next/script";
import { Card, Badge, Input } from "@/components/ui/WireframePrimitives";
import { Search, Ban, CheckCircle, Users, Eye } from "lucide-react";
import { Role } from "@/generated/prisma/enums";

interface UsersPageProps {
  searchParams?: Promise<{
    search?: string;
    role?: string;
    status?: string;
  }>;
}

function mapUserRole(user: {
  role: string | null;
  agencyProfile?: unknown | null;
}) {
  return user.role?.toUpperCase() === "AGENCY" || user.agencyProfile
    ? "Agency"
    : "Resident";
}

function mapUserStatus(user: {
  deletedAt?: Date | string | null;
  citizenProfile?: { isVerified: boolean } | null;
  agencyProfile?: { isVerified: boolean } | null;
}) {
  if (user.deletedAt) return "Blocked";
  if (user.agencyProfile)
    return user.agencyProfile.isVerified ? "Verified" : "Pending";
  if (user.citizenProfile)
    return user.citizenProfile.isVerified ? "Verified" : "Pending";
  return "Pending";
}

function statusStyle(status: string) {
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

function roleStyle(role: string) {
  switch (role) {
    case "Agency":
      return "text-blue-700 bg-blue-50 border border-blue-300";
    default:
      return "text-green-700 bg-green-50 border border-green-300";
  }
}

async function verifyResident(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  await prisma.$transaction([
    prisma.citizenProfile.updateMany({
      where: { userId },
      data: { isVerified: true },
    }),
    prisma.agencyProfile.updateMany({
      where: { userId },
      data: { isVerified: true },
    }),
  ]);

  revalidatePath("/admin/users");
}

async function toggleResidentBlock(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") || "");
  const isBlocked = formData.get("isBlocked") === "true";
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: isBlocked ? null : new Date() },
  });

  revalidatePath("/admin/users");
}

export default async function UserManagementPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;
  const search = params?.search?.trim() || "";
  const roleFilter = params?.role || "ALL";
  const statusFilter = params?.status || "ALL";
  const normalizedSearch = search.toLowerCase();

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

  const filtered = users.filter((user) => {
    const role = mapUserRole(user);
    const status = mapUserStatus(user);
    const matchesRole = roleFilter === "ALL" || role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
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

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-[#0B1120] min-h-full">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-white text-sm mt-0.5">
            Manage citizen accounts and verification.
          </p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {filtered.length} Users
        </Badge>
      </div>

      <Card className="p-5 border-green-100 dark:border-gray-800 shadow-sm">
        <div className="mb-5">
          <form
            id="user-filters-form"
            className="flex justify-between items-center"
            action="/admin/users"
          >
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                name="search"
                className="pl-9 border-green-200 focus:ring-green-400"
                placeholder="Search user..."
                defaultValue={search}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                name="role"
                defaultValue={roleFilter}
                data-auto-submit="true"
                className="text-sm border border-green-300 text-green-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-[#1F2937] cursor-pointer"
              >
                <option value="ALL">All Role</option>
                <option value="Resident">Resident</option>
                <option value="Agency">Agency</option>
              </select>
              <select
                name="status"
                defaultValue={statusFilter}
                data-auto-submit="true"
                className="text-sm border border-green-300 text-green-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-[#1F2937] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Blocked">Blocked</option>
              </select>
              <button className="sr-only">Apply filters</button>
            </div>
          </form>
          <Script id="users-filter-auto-submit" strategy="afterInteractive">
            {`
              if (!window.__livonUsersFilterBound) {
                window.__livonUsersFilterBound = true;
                document.addEventListener('change', function (event) {
                  var target = event.target;
                  if (!target || !target.matches || !target.matches('#user-filters-form [data-auto-submit="true"]')) return;
                  var form = document.getElementById('user-filters-form');
                  if (form) form.requestSubmit();
                });
              }
            `}
          </Script>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left text-sm border-collapse min-w-[800px] md:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-white font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">House Number / Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map((user) => {
                const role = mapUserRole(user);
                const status = mapUserStatus(user);
                const displayName =
                  user.citizenProfile?.fullName ||
                  user.agencyProfile?.agencyName ||
                  user.email;
                const address =
                  user.citizenProfile?.blockHouse ||
                  user.agencyProfile?.address ||
                  "-";

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${roleStyle(role)}`}
                        >
                          {displayName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {displayName}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-white">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-white">
                      {address}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleStyle(role)}`}
                      >
                        {role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={`text-xs ${statusStyle(status)}`}>
                        {status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <details className="group">
                          <summary className="list-none p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer group-open:fixed group-open:inset-0 group-open:z-40 group-open:bg-black/40 group-open:p-0 group-open:hover:bg-black/40">
                            <Eye className="w-4 h-4" />
                          </summary>
                          <div className="pointer-events-none fixed inset-0 z-50 hidden p-6 group-open:flex group-open:items-center group-open:justify-center">
                            <div className="pointer-events-auto w-full max-w-2xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] p-8 text-left shadow-2xl">
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
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${roleStyle(role)}`}
                                >
                                  {role}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#111827]/50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
                                    Status
                                  </p>
                                  <Badge
                                    className={`mt-2 text-xs ${statusStyle(status)}`}
                                  >
                                    {status}
                                  </Badge>
                                </div>
                                <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#111827]/50 p-4">
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
                                    Phone
                                  </p>
                                  <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                                    {user.citizenProfile?.phone ||
                                      user.agencyProfile?.phone ||
                                      "-"}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#111827]/50 p-4 sm:col-span-2">
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
                                    Address
                                  </p>
                                  <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                                    {address}
                                  </p>
                                </div>
                                {role === "Resident" && (
                                  <>
                                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#111827]/50 p-4">
                                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
                                        NIK
                                      </p>
                                      <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                                        {user.citizenProfile?.nik || "-"}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-[#111827]/50 p-4">
                                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-white">
                                        KK
                                      </p>
                                      <p className="mt-2 font-semibold text-gray-800 dark:text-white">
                                        {user.citizenProfile?.kkNumber || "-"}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </details>

                        {status === "Pending" && (
                          <form action={verifyResident}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                            </button>
                          </form>
                        )}
                        {role === "Resident" && (
                          <form action={toggleResidentBlock}>
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <input
                              type="hidden"
                              name="isBlocked"
                              value={status === "Blocked" ? "true" : "false"}
                            />
                            <button
                              className={`p-1.5 rounded-lg transition-colors ${
                                status === "Blocked"
                                  ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                                  : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                              }`}
                              title={
                                status === "Blocked"
                                  ? "Unblock User"
                                  : "Block User"
                              }
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
