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
  FolderPlus,
  RefreshCw,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase"; // pastikan sudah ada
import { useState, useEffect } from "react";
import React from "react";

type ActiveTab = "personal" | "activity";

// Menambahkan semua tipe yang mungkin dikirim oleh backend
type ActivityType =
  | "voted"
  | "commented"
  | "donated"
  | "project_created"
  | "project_updated"
  | "news_created"
  | "news_updated"
  | "warga_verified";

type ActivityItem = {
  id: string | number;
  type: ActivityType;
  project: string;
  targetTitle: string;
  time: string;
  createdAt: string;
  actionDesc: string; // Tambahan untuk menyimpan teks deskripsi aksi
};

type ProjectActivitySource = {
  id: string;
  title: string;
  agencyId?: string | null;
  createdAt?: string;
};

type NewsActivitySource = {
  id: string;
  title: string;
  createdById: string;
  createdAt?: string;
};

type NewsListResponse = {
  items?: NewsActivitySource[];
};

// Transform database records ke ActivityItem format
function transformToActivityItem(record: {
  id: string;
  type: string;
  action: string;
  targetTitle: string;
  createdAt: string;
}): ActivityItem {
  // Mapping dari ENUM backend ke tipe frontend
  const typeMap: Record<string, ActivityType> = {
    VOTE: "voted",
    COMMENT: "commented",
    DONATION: "donated",
    PROJECT_CREATED: "project_created",
    PROJECT_UPDATED: "project_updated",
    NEWS_CREATED: "news_created",
    NEWS_UPDATED: "news_updated",
    WARGA_VERIFIED: "warga_verified",
  };

  return {
    id: record.id,
    type: typeMap[record.type] || "voted", // Default fallback
    project: record.targetTitle || "Unknown Target",
    targetTitle: record.targetTitle || "Unknown Target",
    time: formatTimeAgo(record.createdAt),
    createdAt: record.createdAt,
    actionDesc: record.action || "Interacted",
  };
}

// Format waktu ke format relatif (e.g., "2 hours ago")
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export default function ProfilePage() {
  // Konfigurasi Label, Warna, dan Ikon untuk SETIAP tipe aktivitas
  const activityConfig: Record<
    ActivityType,
    { label: string; color: string; icon: React.ElementType }
  > = {
    voted: {
      label: "Voted on project",
      color: "bg-green-600 text-white",
      icon: ThumbsUp,
    },
    commented: {
      label: "Commented on project",
      color: "bg-yellow-100 text-yellow-800",
      icon: MessageSquare,
    },
    donated: {
      label: "Donated to project",
      color: "bg-green-700 text-white",
      icon: Heart,
    },
    project_created: {
      label: "Created Project",
      color: "bg-blue-600 text-white",
      icon: FolderPlus,
    },
    project_updated: {
      label: "Updated Project",
      color: "bg-blue-100 text-blue-800",
      icon: RefreshCw,
    },
    news_created: {
      label: "Published News",
      color: "bg-purple-600 text-white",
      icon: FileText,
    },
    news_updated: {
      label: "Updated News",
      color: "bg-purple-100 text-purple-800",
      icon: RefreshCw,
    },
    warga_verified: {
      label: "Verified User",
      color: "bg-emerald-100 text-emerald-800",
      icon: UserCheck,
    },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Listen to global app sidebar toggle
  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-app-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-app-sidebar", handleToggle);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("livon-token");
    window.location.href = "/auth/login";
  }

  const userRole =
    user?.role === "WARGA" && !user?.agencyProfile ? "resident" : "agency";

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem("livon-token");
      if (!token) {
        setUser(null);
        return null;
      }
      const res = await fetch("/api/users/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const nextUser = data.data || data.data?.data || null;
        setUser(nextUser);
        return nextUser as UserWithProfile | null;
      }
      return null;
    }

    async function fetchActivities(nextUser: UserWithProfile | null) {
      const token = localStorage.getItem("livon-token");
      if (!token) return;
      if (nextUser?.role !== "WARGA") {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const [projectsRes, newsRes] = await Promise.all([
            fetch("/api/projects", { headers }),
            fetch("/api/news?page=1&limit=20", { headers }),
          ]);

          const [projectsJson, newsJson] = await Promise.all([
            projectsRes.ok ? projectsRes.json() : Promise.resolve(null),
            newsRes.ok ? newsRes.json() : Promise.resolve(null),
          ]);

          const projects = (projectsJson?.data ||
            []) as ProjectActivitySource[];
          const newsItems = (newsJson?.data || {}) as NewsListResponse;

          const projectActivities = projects
            .filter((project) => project.agencyId === nextUser?.id)
            .map((project) => ({
              id: `project-created-${project.id}`,
              type: "project_created" as ActivityType,
              project: project.title,
              targetTitle: project.title,
              time: formatTimeAgo(
                project.createdAt || new Date().toISOString(),
              ),
              createdAt: project.createdAt || new Date().toISOString(),
              actionDesc: "Created a project",
            }));

          const newsActivities = (newsItems.items || [])
            .filter((item) => item.createdById === nextUser?.id)
            .map((item) => ({
              id: `news-created-${item.id}`,
              type: "news_created" as ActivityType,
              project: item.title,
              targetTitle: item.title,
              time: formatTimeAgo(item.createdAt || new Date().toISOString()),
              createdAt: item.createdAt || new Date().toISOString(),
              actionDesc: "Published news",
            }));

          setActivities(
            [...projectActivities, ...newsActivities].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          );
        } catch (error) {
          console.error("Error fetching agency activities:", error);
          setActivities([]);
        }
        return;
      }

      try {
        const res = await fetch("/api/users/activity", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const transformedActivities = json.data
              .slice(0, 20)
              .map(transformToActivityItem);

            setActivities(transformedActivities);
          }
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      }
    }

    fetchUser().then(fetchActivities);
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
        if (prev.citizenProfile && data.data) {
          newUser.citizenProfile = { ...prev.citizenProfile, ...data.data };
        } else if (prev.agencyProfile && data.data) {
          newUser.agencyProfile = { ...prev.agencyProfile, ...data.data };
        }
        if (data.data?.email) newUser.email = data.data.email;
        if (data.data?.role) newUser.role = data.data.role;
        return newUser;
      });
      setFeedback("Data successfully updated!");
    } else {
      setFeedback("Failed to update data.");
    }
  }

  if (!user) {
    return (
      <div className="p-10 text-red-500">User not found or not logged in.</div>
    );
  }

  // --- Insight Computations (Hanya dihitung jika Warga) ---
  const totalVotes = activities.filter((a) => a.type === "voted").length;
  const totalComments = activities.filter((a) => a.type === "commented").length;
  const totalDonations = activities.filter((a) => a.type === "donated").length;

  let mostInteractedProject = "";
  let maxInteractions = 0;

  if (userRole === "resident" && activities.length > 0) {
    const projectCounts: Record<string, number> = {};
    activities.forEach((a) => {
      projectCounts[a.targetTitle] = (projectCounts[a.targetTitle] || 0) + 1;
    });
    for (const [proj, count] of Object.entries(projectCounts)) {
      if (count > maxInteractions) {
        maxInteractions = count;
        mostInteractedProject = proj;
      }
    }
  }

  // --- Insight Computations (Hanya dihitung jika Admin/Agency) ---
  const totalProjectsMade = activities.filter(
    (a) => a.type === "project_created",
  ).length;
  const totalNewsMade = activities.filter(
    (a) => a.type === "news_created",
  ).length;
  const totalVerified = activities.filter(
    (a) => a.type === "warga_verified",
  ).length;

  const lastActivityTime =
    activities.length > 0 ? formatTimeAgo(activities[0].createdAt) : null;
  // -----------------------------

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "absolute md:relative z-[2147483646] w-72 h-full bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-8 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
            {userRole === "agency"
              ? user?.agencyProfile?.agencyName || "Administrator"
              : user?.citizenProfile?.fullName || user?.name || ""}
          </p>
          <p className="text-xs text-gray-500 dark:text-white mt-1 break-all">
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
              onClick={() => {
                setActiveTab(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.key ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-sm" : "text-gray-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-green-400"}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 transition-all shadow-md"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 pt-16 md:pt-10">
        {activeTab === "personal" && (
          <div className="max-w-xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Personal Information
              </h1>
              <p className="text-gray-400 dark:text-white text-sm mt-1">
                Manage your account details and preferences.
              </p>
            </div>
            {/* Form personal information (Tidak diubah) */}
            <form onSubmit={updateProfile} className="space-y-5">
              {userRole === "agency" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Agency Name
                    </label>
                    <input
                      name="agencyName"
                      defaultValue={user?.agencyProfile?.agencyName || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      defaultValue={user?.email ?? ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      defaultValue={user?.agencyProfile?.phone || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Agency Address
                    </label>
                    <input
                      name="address"
                      defaultValue={user?.agencyProfile?.address || ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      name="fullName"
                      defaultValue={
                        user?.citizenProfile?.fullName || user?.name || ""
                      }
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      name="email"
                      defaultValue={user?.email ?? ""}
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      defaultValue={
                        user?.citizenProfile?.phone || user?.phone || ""
                      }
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      National Identity Number (NIK)
                    </label>
                    <input
                      type="text"
                      value={user?.citizenProfile?.nik || ""}
                      readOnly
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-100 dark:bg-slate-800 text-sm text-gray-500 dark:text-white cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Family card Number (KK)
                    </label>
                    <input
                      type="text"
                      value={user?.citizenProfile?.kkNumber || ""}
                      readOnly
                      className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-slate-100 dark:bg-slate-800 text-sm text-gray-500 dark:text-white cursor-not-allowed select-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        House Block
                      </label>
                      <input
                        name="blokRumah"
                        defaultValue={
                          user?.citizenProfile?.blockHouse ||
                          user?.blokRumah ||
                          ""
                        }
                        className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        House Number
                      </label>
                      <input
                        name="noRumah"
                        defaultValue={
                          user?.citizenProfile?.houseNumber ||
                          user?.noRumah ||
                          ""
                        }
                        className="w-full h-12 px-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <div className="flex items-center gap-2 h-12 px-5 rounded-xl border border-green-200 bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-semibold text-green-700">
                    Verified
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all mt-1 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              {feedback && (
                <div
                  className={`mt-2 text-center text-sm font-semibold ${feedback.includes("success") ? "text-green-600" : "text-red-500"}`}
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recent Activity
              </h1>
              <p className="text-gray-400 dark:text-white text-sm mt-1">
                Activity log and interactions on the LIVON platform.
              </p>
            </div>

            <div className="relative py-2">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-start">
                <span className="bg-slate-50 dark:bg-[#0B1120] pr-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Activity Summary
                </span>
              </div>
            </div>

            {/* Statistik Akumulasi - Berbeda berdasarkan Role */}
            <div className="mb-6 space-y-3">
              {userRole === "agency" ? (
                // Card Statistik Khusus Admin/Agency
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {totalProjectsMade}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        Projects Created
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-purple-700">
                        {totalNewsMade}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        News Published
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-emerald-700">
                        {totalVerified}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        Verified Residents
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Card Statistik Khusus Warga
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {totalVotes}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        Total Votes
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-yellow-700">
                        {totalComments}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        Total Comments
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {totalDonations}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-semibold">
                        Total Donations
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Insights Khusus Warga */}
            {userRole === "resident" &&
              activities.length > 0 &&
              mostInteractedProject && (
                <div className="mb-8 space-y-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 items-start">
                    <Activity className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      You care a lot about the project{" "}
                      <span className="font-semibold text-gray-900">
                        {mostInteractedProject}
                      </span>{" "}
                      ({maxInteractions} interactions).
                    </p>
                  </div>
                </div>
              )}

            {/* Insights General (Waktu Aktivitas Terakhir) */}
            {lastActivityTime && (
              <div className="mb-8 bg-white border border-gray-200 rounded-xl p-4 flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  Your last activity was recorded on{" "}
                  <span className="font-semibold">{lastActivityTime}</span>.
                </p>
              </div>
            )}

            <div className="relative py-2">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-start">
                <span className="bg-slate-50 dark:bg-[#0B1120] pr-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Activity History
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {activities.length === 0 && (
                <div className="text-gray-400 dark:text-white text-center py-8">
                  No activity yet.
                </div>
              )}
              {activities.map((item) => {
                const config = activityConfig[item.type];
                const IconComponent = config?.icon || Activity;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 hover:border-gray-400 transition-all"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${config?.color || "bg-gray-100 text-gray-600"}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {config?.label || item.actionDesc}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white truncate">
                        {item.targetTitle}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-white flex-shrink-0">
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
