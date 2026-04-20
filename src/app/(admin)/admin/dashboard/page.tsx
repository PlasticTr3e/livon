"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui/WireframePrimitives";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  DollarSign,
  Activity,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  MessageSquare,
  CheckCircle2,
  Loader,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface ProjectData {
  id: string;
  title: string;
  description: string;
  budgetTarget: number;
  currentFunding?: number;
  imageUrls?: string[];
  status?: string;
  createdAt?: string;
}

const chartData = [
  { name: "Jan", votes: 400, comments: 240 },
  { name: "Feb", votes: 300, comments: 139 },
  { name: "Mar", votes: 200, comments: 280 },
  { name: "Apr", votes: 278, comments: 190 },
  { name: "Mei", votes: 389, comments: 280 },
  { name: "Jun", votes: 439, comments: 380 },
];
// TODO: Replace with dynamic data when engagement/analytics endpoint is available

function EngagementChart({ isDark }: { isDark: boolean }) {
  const maxVal = Math.max(...chartData.flatMap((d) => [d.votes, d.comments]));
  const padded = Math.ceil(maxVal / 100) * 100;
  const svgH = 200;
  const svgW = 520;
  const padL = 44;
  const padB = 28;
  const padT = 10;
  const padR = 16;
  const chartH = svgH - padT - padB;
  const chartW = svgW - padL - padR;
  const cols = chartData.length;
  const groupW = chartW / cols;
  const barW = Math.min(groupW * 0.28, 22);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * padded));

  const gridColor = isDark ? "#334155" : "#e5e7eb";
  const labelColor = isDark ? "#64748b" : "#9ca3af";
  const voteColor = isDark ? "#4ade80" : "#16a34a";
  const commentColor = isDark ? "#fbbf24" : "#eab308";

  return (
    <div className="w-full">
      <div className="flex items-center gap-5 mb-4 pl-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: voteColor }}
          />
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Votes
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: commentColor }}
          />
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Komentar
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        style={{ height: 240 }}
        aria-label="Engagement chart"
      >
        {yTicks.map((tick) => {
          const y = padT + chartH - (tick / padded) * chartH;
          return (
            <g key={`ytick-${tick}`}>
              <line
                x1={padL}
                x2={svgW - padR}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? "none" : "3 3"}
              />
              <text
                x={padL - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={labelColor}
              >
                {tick}
              </text>
            </g>
          );
        })}
        {chartData.map((d, i) => {
          const cx = padL + i * groupW + groupW / 2;
          const vH = (d.votes / padded) * chartH;
          const cH = (d.comments / padded) * chartH;
          const vX = cx - barW - 2;
          const cX = cx + 2;
          return (
            <g key={`bar-${i}`}>
              <rect
                x={vX}
                y={padT + chartH - vH}
                width={barW}
                height={vH}
                fill={voteColor}
                rx={4}
              />
              <rect
                x={cX}
                y={padT + chartH - cH}
                width={barW}
                height={cH}
                fill={commentColor}
                rx={4}
              />
              <text
                x={cx}
                y={svgH - 6}
                textAnchor="middle"
                fontSize={11}
                fill={labelColor}
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminDashboardPage() {
  const isDark = false; // Mock - replace with actual theme context
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const response = await apiFetch<ProjectData[]>("/api/projects", {
          headers,
        });
        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Calculate dynamic stats
  const totalProjects = projects.length;
  const totalFunding = projects.reduce(
    (sum, p) => sum + (p.currentFunding || 0),
    0,
  );
  const activeCampaigns = projects.filter(
    (p) =>
      p.status &&
      (p.status.toUpperCase() === "BERJALAN" ||
        p.status.toUpperCase() === "DISETUJUI"),
  );
  const avgEngagement = Math.round(
    (activeCampaigns.length / Math.max(totalProjects, 1)) * 100,
  );

  const stats = [
    {
      title: "Total Proyek",
      value: totalProjects.toString(),
      icon: FolderGit2,
      trend: "+12%",
      trendUp: true,
      bg: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800",
      iconBg: "bg-gradient-to-br from-green-500 to-green-700 text-white",
    },
    {
      title: "Warga Aktif",
      value: (projects.length * 2).toLocaleString("id-ID"),
      icon: Users,
      trend: "+5%",
      trendUp: true,
      bg: "bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/10 border-blue-200 dark:border-blue-800",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
    },
    {
      title: "Total Dana",
      value: `Rp ${(totalFunding / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      trend: "+20%",
      trendUp: true,
      bg: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-800",
      iconBg: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
    },
    {
      title: "Engagement",
      value: `${avgEngagement}%`,
      icon: Activity,
      trend: "+3%",
      trendUp: true,
      bg: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10 border-purple-200 dark:border-purple-800",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600 text-white",
    },
  ];

  const recentProjects = projects.slice(0, 4).map((p) => ({
    name: p.title,
    status:
      p.status === "BERJALAN"
        ? "Construction"
        : p.status === "DISETUJUI"
          ? "Funding"
          : p.status === "USULAN"
            ? "Planning"
            : "Completed",
    progress:
      p.budgetTarget > 0
        ? Math.round(((p.currentFunding || 0) / p.budgetTarget) * 100)
        : 0,
  }));

  const priorityProject = projects.length > 0 ? projects[0] : null;

  const statusColor = (s: string) => {
    switch (s) {
      case "Planning":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
      case "Funding":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
      case "Construction":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700";
      case "Completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
      default:
        return "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300";
    }
  };

  const progressGradient = (s: string) => {
    switch (s) {
      case "Planning":
        return "bg-gradient-to-r from-blue-400 to-blue-600";
      case "Funding":
        return "bg-gradient-to-r from-yellow-400 to-amber-500";
      case "Construction":
        return "bg-gradient-to-r from-orange-400 to-orange-600";
      case "Completed":
        return "bg-gradient-to-r from-green-400 to-green-600";
      default:
        return "bg-gray-400";
    }
  };

  const progressDot = (s: string) => {
    switch (s) {
      case "Planning":
        return "bg-blue-500";
      case "Funding":
        return "bg-yellow-500";
      case "Construction":
        return "bg-orange-500";
      case "Completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">
            Dashboard Admin
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
            Ringkasan metrik dan aktivitas platform LIVON.
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 px-3 py-1.5 shadow-sm">
          {loading ? "⏳ Memuat..." : "✅ Update: Hari ini"}
        </Badge>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className={`p-5 border shadow-sm ${stat.bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-black text-gray-900 dark:text-slate-100 mt-1.5">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${stat.iconBg}`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs">
                  <TrendingUp className="w-3.5 h-3.5 mr-1 text-green-500 dark:text-green-400" />
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {stat.trend}
                  </span>
                  <span className="text-gray-400 dark:text-slate-500 ml-1.5">
                    vs bulan lalu
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <Card className="p-6 lg:col-span-2 border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100">
                  Engagement Komunitas
                </h3>
                <span className="text-xs text-gray-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full font-medium">
                  6 Bulan Terakhir
                </span>
              </div>
              <EngagementChart isDark={isDark} />
            </Card>

            {/* Priority Project */}
            <Card className="p-5 border-gray-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                  Proyek Prioritas
                </h3>
                <Link
                  href={
                    priorityProject
                      ? `/admin/projects/${priorityProject.id}`
                      : "/admin/projects"
                  }
                  className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5 hover:underline"
                >
                  Detail <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              {priorityProject ? (
                <>
                  <div className="w-full h-36 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10 rounded-xl mb-4 flex items-center justify-center border border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-1" />
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                        {priorityProject.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 mb-2">
                      {priorityProject.status === "BERJALAN"
                        ? "Konstruksi"
                        : priorityProject.status === "DISETUJUI"
                          ? "Pendanaan"
                          : "Perencanaan"}
                    </Badge>
                    <h4 className="font-bold text-base mb-1 text-gray-900 dark:text-slate-100">
                      {priorityProject.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-green-500 dark:text-green-400" />{" "}
                      {priorityProject.description?.split("\n")[0] ||
                        "Lokasi belum tersedia"}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400">
                          Skor Prioritas
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          8.5/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          style={{ width: "85%" }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-slate-400">
                          Progress
                        </span>
                        <span className="font-bold text-gray-800 dark:text-slate-200">
                          {priorityProject.budgetTarget > 0
                            ? Math.round(
                                ((priorityProject.currentFunding || 0) /
                                  priorityProject.budgetTarget) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                          style={{
                            width: `${priorityProject.budgetTarget > 0 ? Math.round(((priorityProject.currentFunding || 0) / priorityProject.budgetTarget) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 flex-1 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">
                    Belum ada proyek
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Recent Projects + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 border-gray-200 dark:border-slate-700 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100">
                  Proyek Terbaru
                </h3>
                <Link
                  href="/admin/projects"
                  className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-0.5 hover:underline"
                >
                  Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentProjects.map((p, idx) => (
                  <div key={idx} className="py-3.5 flex items-center gap-4">
                    <div
                      className={`w-2 h-10 rounded-full ${progressDot(p.status)}`}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`${progressGradient(p.status)} h-full rounded-full`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium shrink-0">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 ${statusColor(p.status)}`}
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              {/* Quick Actions */}
              <Card className="p-5 border-gray-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm">
                  Aksi Cepat
                </h3>
                <div className="space-y-1.5">
                  {[
                    {
                      icon: FolderGit2,
                      label: "Buat Proyek Baru",
                      href: "/admin/projects/create",
                      hoverBg:
                        "hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400",
                    },
                    {
                      icon: MessageSquare,
                      label: "Monitor Komentar",
                      href: "/admin/comments",
                      hoverBg:
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400",
                    },
                    {
                      icon: DollarSign,
                      label: "Monitor Crowdfunding",
                      href: "/admin/crowdfunding",
                      hoverBg:
                        "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-700 dark:hover:text-yellow-400",
                    },
                    {
                      icon: Users,
                      label: "Kelola Pengguna",
                      href: "/admin/users",
                      hoverBg:
                        "hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400",
                    },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-slate-600 transition-all group ${action.hoverBg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <action.icon className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-inherit transition-colors" />
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-inherit transition-colors">
                          {action.label}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600 group-hover:text-inherit transition-colors" />
                    </Link>
                  ))}
                </div>
              </Card>

              {/* Alert */}
              <Card className="p-4 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">
                      Perlu Perhatian
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5 leading-relaxed">
                      3 komentar menunggu moderasi di Community Park Renovation.
                    </p>
                    <Link
                      href="/admin/comments"
                      className="text-xs text-yellow-600 dark:text-yellow-400 font-bold mt-1.5 block hover:underline"
                    >
                      Review sekarang →
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
