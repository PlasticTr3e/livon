"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Badge,
  Input,
  cn,
} from "@/components/ui/WireframePrimitives";
import { Search, Shield, Ban, CheckCircle, Users, Eye, X } from "lucide-react";
import { getUsersAction, toggleUserVerificationAction } from "./actions";

interface CitizenProfile {
  id: string;
  fullName: string;
  blockHouse: string | null;
  isVerified: boolean;
  phone?: string;
  nik?: string;
  kkNumber?: string;
}

interface AgencyProfile {
  id: string;
  agencyName: string;
  address: string;
  isVerified: boolean;
  phone?: string;
}

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  role: string | null;
  citizenProfile?: CitizenProfile | null;
  agencyProfile?: AgencyProfile | null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editKkNumber, setEditKkNumber] = useState("");
  const [editNik, setEditNik] = useState("");
  const [editIsAgency, setEditIsAgency] = useState(false);

  const [roleFilter, setRoleFilter] = useState("ALL");

  // Map backend role/status to UI
  function mapUserRole(
    role: string | null,
    agencyProfile?: AgencyProfile | null,
  ) {
    if (role === "WARGA") return "Resident";
    if (role === "AGENCY" || agencyProfile) return "Manager";
    return "Admin";
  }

  function mapUserStatus(user: UserData) {
    // Try to infer status from isVerified or fallback
    if (user.citizenProfile)
      return user.citizenProfile.isVerified ? "Verified" : "Pending";
    if (user.agencyProfile)
      return user.agencyProfile.isVerified ? "Verified" : "Pending";
    return "Pending";
  }

  // Fetch users from API
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      try {
        const result = await getUsersAction();
        if (result.success) {
          setUsers(result.data || []);
        } else {
          throw new Error(result.message);
        }
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Gagal mengambil data pengguna.",
        );
        setUsers([]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  // Action handlers
  async function handleVerify(id: string) {
    try {
      const result = await toggleUserVerificationAction(id, true);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  citizenProfile: u.citizenProfile
                    ? { ...u.citizenProfile, isVerified: true }
                    : u.citizenProfile,
                  agencyProfile: u.agencyProfile
                    ? { ...u.agencyProfile, isVerified: true }
                    : u.agencyProfile,
                }
              : u,
          ),
        );
      } else {
        alert("Gagal memverifikasi: " + result.message);
      }
    } catch {}
  }

  async function handleSuspend(id: string) {
    const user = users.find((u) => u.id === id);
    const isSuspended =
      user?.citizenProfile?.isVerified === false ||
      user?.agencyProfile?.isVerified === false;
    try {
      const result = await toggleUserVerificationAction(id, !isSuspended);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  citizenProfile: u.citizenProfile
                    ? { ...u.citizenProfile, isVerified: !isSuspended }
                    : u.citizenProfile,
                  agencyProfile: u.agencyProfile
                    ? { ...u.agencyProfile, isVerified: !isSuspended }
                    : u.agencyProfile,
                }
              : u,
          ),
        );
      } else {
        alert("Gagal mengubah status: " + result.message);
      }
    } catch {}
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase?.().includes(search.toLowerCase()) ||
      u.citizenProfile?.blockHouse
        ?.toLowerCase?.()
        .includes(search.toLowerCase()) ||
      u.agencyProfile?.agencyName
        ?.toLowerCase?.()
        .includes(search.toLowerCase());

    const role = mapUserRole(u.role, u.agencyProfile);
    const matchesRole = roleFilter === "ALL" ? true : role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const statusStyle = (s: string) => {
    switch (s) {
      case "Verified":
        return "bg-green-100 text-green-700 border-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Suspended":
        return "bg-red-100 text-red-600 border-red-300";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const roleStyle = (r: string) => {
    switch (r) {
      case "Admin":
        return "text-yellow-700 bg-yellow-50 border border-yellow-300";
      case "Manager":
        return "text-blue-700 bg-blue-50 border border-blue-300";
      default:
        return "text-green-700 bg-green-50 border border-green-300";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      {editUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 w-full max-w-lg shadow-lg relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
              onClick={() => setEditUserId(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">User Details</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Name / Agency
                </label>
                <Input
                  value={editName}
                  className="w-full bg-slate-100 dark:bg-slate-800"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  House Number /Address
                </label>
                <Input
                  value={editAddress}
                  className="w-full bg-slate-100 dark:bg-slate-800"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Phone Number
                </label>
                <Input
                  value={editPhone || "-"}
                  className="w-full bg-slate-100 dark:bg-slate-800"
                  disabled
                />
              </div>
              {!editIsAgency && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Nomor Induk Kependudukan (NIK)
                    </label>
                    <Input
                      value={editNik || "-"}
                      className="w-full bg-slate-100 dark:bg-slate-800"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Kartu Keluarga (KK)
                    </label>
                    <Input
                      value={editKkNumber || "-"}
                      className="w-full bg-slate-100 dark:bg-slate-800"
                      disabled
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-6 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserId(null)}
                >
                  Tutup
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Manage citizen accounts and verification.
          </p>
        </div>
        <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {users.length} Users
        </Badge>
      </div>

      <Card className="p-5 border-green-100 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 border-green-200 focus:ring-green-400"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-green-300 text-green-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white dark:bg-slate-800 cursor-pointer"
          >
            <option value="ALL">All Role</option>
            <option value="Resident">Resident</option>
            <option value="Manager">Manager</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading data...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">House Number / Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map((user) => {
                const role = mapUserRole(user.role, user.agencyProfile);
                const status = mapUserStatus(user);
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                            roleStyle(role),
                          )}
                        >
                          {(
                            user.citizenProfile?.fullName ||
                            user.agencyProfile?.agencyName ||
                            user.name ||
                            user.email ||
                            ""
                          ).charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-slate-200">
                          {user.citizenProfile?.fullName ||
                            user.agencyProfile?.agencyName ||
                            user.name ||
                            user.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-slate-400">
                      {user.citizenProfile?.blockHouse ||
                        user.agencyProfile?.address ||
                        "-"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                          roleStyle(role),
                        )}
                      >
                        {role === "Admin" && <Shield className="w-3 h-3" />}
                        {role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={cn("text-xs", statusStyle(status))}>
                        {status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditUserId(user.id);
                            setEditName(
                              user.citizenProfile?.fullName ||
                                user.agencyProfile?.agencyName ||
                                user.name ||
                                "",
                            );
                            setEditAddress(
                              user.citizenProfile?.blockHouse ||
                                user.agencyProfile?.address ||
                                "",
                            );
                            setEditPhone(
                              user.citizenProfile?.phone ||
                                user.agencyProfile?.phone ||
                                "",
                            );
                            setEditNik(user.citizenProfile?.nik || "");
                            setEditKkNumber(
                              user.citizenProfile?.kkNumber || "",
                            );
                            setEditIsAgency(!!user.agencyProfile);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {status === "Pending" && (
                          <button
                            onClick={() => handleVerify(user.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-green-600 hover:bg-green-50 text-xs font-semibold transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                          </button>
                        )}
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            status === "Verified"
                              ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50",
                          )}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
