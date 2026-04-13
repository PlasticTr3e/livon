"use client";
import {
  User,
  LogOut,
  Activity,
  ChevronRight,
  CheckCircle2,
  Save,
  ThumbsUp,
  MessageSquare,
  Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabase"; // pastikan sudah ada
import { useState, useEffect } from "react";
import React from "react";

type ActiveTab = "personal" | "activity";

export default function ProfilePage() {
  type ActivityItem = {
    id: string | number;
    type: "voted" | "commented" | "donated";
    project: string;
    time: string;
  };
  const activityLabel = {
    voted: "Voted on project",
    commented: "Commented on project",
    donated: "Donated to project",
  };
  const activityColor = {
    voted: "bg-green-600 text-white",
    commented: "bg-yellow-100 text-yellow-800",
    donated: "bg-green-700 text-white",
  };

  type CitizenProfile = {
    fullName?: string;
    phone?: string;
    blockHouse?: string;
    houseNumber?: string;
    nik?: string;
    kk?: string;
    kkNumber?: string;
  };
  type AgencyProfile = {
    agencyName?: string;
    phone?: string;
    address?: string;
  };
  type UserWithProfile = {
    id: string;
    role: string | null;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name?: string | null;
    phone?: string | null;
    blokRumah?: string | null;
    noRumah?: string | null;
    citizenProfile?: CitizenProfile;
    agencyProfile?: AgencyProfile;
  };

  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal");

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("livon-token");
    window.location.href = "/auth/login";
  }

  let userRole = "Resident";
  if (user?.role === "ADMIN") userRole = "Admin";
  else if (user?.role === "MANAGER" || user?.agencyProfile)
    userRole = "Manager";

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("livon-token");
      if (!token) {
        setUser(null);
        return;
      }
      const res = await fetch("/api/users/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data || data.data?.data || null);
      }
    }
    async function fetchActivities() {
      const token = localStorage.getItem("livon-token");
      if (!token) return;
      const res = await fetch("/api/users/activities", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.data || []);
      }
    }
    fetchUser();
    fetchActivities();
  }, []);

  async function updateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem("livon-token");
    if (!token) return;
    const body = {
      fullName: formData.get("fullName") || undefined,
      phone: formData.get("phone") || undefined,
      blockHouse: formData.get("blokRumah") || undefined,
      houseNumber: formData.get("noRumah") || undefined,
    };
    const res = await fetch("/api/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setUser((prev) => {
        if (!prev) return data.data || data.data?.data || null;
        const newUser = { ...prev };
        // Gabungkan citizenProfile jika ada
        if (prev.citizenProfile && data.data) {
          newUser.citizenProfile = { ...prev.citizenProfile, ...data.data };
        } else if (prev.agencyProfile && data.data) {
          newUser.agencyProfile = { ...prev.agencyProfile, ...data.data };
        }
        // Update field di root user jika ada
        if (data.data?.email) newUser.email = data.data.email;
        if (data.data?.role) newUser.role = data.data.role;
        return newUser;
      });
      setFeedback("Data berhasil diperbarui!");
    } else {
      setFeedback("Gagal memperbarui data.");
    }
  }

  if (!user) {
    return (
      <div className="p-10 text-red-500">User not found or not logged in.</div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950">
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col flex-shrink-0">
        <div className="p-8 flex flex-col items-center text-center border-b border-gray-100 dark:border-slate-700">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-bold text-gray-900 dark:text-slate-100 text-base leading-tight">
            {userRole === "Manager"
              ? user?.agencyProfile?.agencyName
              : user?.citizenProfile?.fullName || user?.name || ""}
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 break-all">
            {user?.email ?? ""}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-xs font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
            {userRole}
          </span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {[
            {
              key: "personal" as ActiveTab,
              label: "Personal Information",
              icon: User,
            },
            {
              key: "activity" as ActiveTab,
              label: "Recent Activity",
              icon: Activity,
            },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.key ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm" : "text-gray-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400"}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto p-10">
        {activeTab === "personal" && (
          <div className="max-w-xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Personal Information
              </h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                Manage your account details and preferences.
              </p>
            </div>
            <form onSubmit={updateProfile} className="space-y-5">
              {userRole === "Manager" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nama Instansi
                    </label>
                    <input
                      name="agencyName"
                      defaultValue={user?.agencyProfile?.agencyName || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      defaultValue={user?.email ?? ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      name="phone"
                      defaultValue={user?.agencyProfile?.phone || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Alamat Instansi
                    </label>
                    <input
                      name="address"
                      defaultValue={user?.agencyProfile?.address || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      name="fullName"
                      defaultValue={
                        user?.citizenProfile?.fullName || user?.name || ""
                      }
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      defaultValue={user?.email ?? ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      name="phone"
                      defaultValue={
                        user?.citizenProfile?.phone || user?.phone || ""
                      }
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      NIK
                    </label>
                    <input
                      type="text"
                      value={user?.citizenProfile?.nik || ""}
                      readOnly
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-sm text-gray-500 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Nomor KK
                    </label>
                    <input
                      type="text"
                      value={user?.citizenProfile?.kkNumber || ""}
                      readOnly
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-sm text-gray-500 cursor-not-allowed select-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Blok Rumah
                      </label>
                      <input
                        name="blokRumah"
                        defaultValue={
                          user?.citizenProfile?.blockHouse ||
                          user?.blokRumah ||
                          ""
                        }
                        className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        No. Rumah
                      </label>
                      <input
                        name="noRumah"
                        defaultValue={
                          user?.citizenProfile?.houseNumber ||
                          user?.noRumah ||
                          ""
                        }
                        className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Status Akun
                </label>
                <div className="flex items-center gap-2 h-12 px-5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Verified
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all mt-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan
              </button>
              {feedback && (
                <div
                  className={`mt-2 text-center text-sm font-semibold ${feedback.includes("berhasil") ? "text-green-600" : "text-red-500"}`}
                >
                  {feedback}
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="max-w-xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Recent Activity
              </h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
                Your latest interactions with community projects.
              </p>
            </div>
            <div className="space-y-3">
              {activities.length === 0 && (
                <div className="text-gray-400 dark:text-slate-500 text-center py-8">
                  Belum ada aktivitas.
                </div>
              )}
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 hover:border-green-400 dark:hover:border-green-600 transition-all"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${activityColor[item.type as keyof typeof activityColor]}`}
                  >
                    {item.type === "voted" && <ThumbsUp className="w-4 h-4" />}
                    {item.type === "commented" && (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    {item.type === "donated" && <Heart className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
                      {activityLabel[item.type as keyof typeof activityLabel]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      {item.project}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
