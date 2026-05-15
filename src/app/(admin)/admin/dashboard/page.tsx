"use client";
import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui/WireframePrimitives";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  DollarSign,
  MessageCircle,
  Loader,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- TYPES & INTERFACES ---

interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

interface SentimentAnalytics {
  distribution?: SentimentDistribution;
  averageScore?: number;
}

interface ProjectData {
  id: string;
  title: string;
  status?: string;
  totalVotes?: number;
  currentFunding?: number | string;
  sentimentAnalytics?: SentimentAnalytics;
}

interface DashboardMetrics {
  totalWargaAktif: number;
  totalProyek: number;
  totalPartisipasi: number;
  totalDana: number;
}

interface PieChartData {
  name: string;
  value: number;
}

interface DonationData {
  id: string;
  userId?: string;
  amount?: number | string;
  createdAt: string;
  status: string;
}

// --- CONSTANTS ---

const PIE_COLORS: Record<string, string> = {
  Planning: "#3b82f6", // Blue
  Funding: "#eab308", // Yellow
  Construction: "#f97316", // Orange
  Completed: "#22c55e", // Green
};

const STATUS_MAP: Record<string, string> = {
  USULAN: "Planning",
  DISETUJUI: "Funding",
  BERJALAN: "Construction",
  SELESAI: "Completed",
};

export default function AdminDashboardPage() {
  // --- STATE MANAGEMENT ---

  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<"viral" | "sentiment">("viral");

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalWargaAktif: 0,
    totalProyek: 0,
    totalPartisipasi: 0,
    totalDana: 0,
  });

  const [pieData, setPieData] = useState<PieChartData[]>([]);
  const [priorityProjects, setPriorityProjects] = useState<ProjectData[]>([]);

  // --- DATA FETCHING ---

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch data concurrently for performance
        const [metricRes, allProjectsRes, priorityRes] = await Promise.all([
          apiFetch<Partial<DashboardMetrics>>("/api/agency/dashboard", {
            headers,
          }),
          apiFetch<ProjectData[]>("/api/projects", { headers }),
          apiFetch<ProjectData[]>("/api/projects/priority", { headers }),
        ]);

        let finalMetrics: DashboardMetrics = {
          totalWargaAktif: 0,
          totalProyek: 0,
          totalPartisipasi: 0,
          totalDana: 0,
        };

        // 1. Assign overall dashboard metrics
        if (metricRes.success && metricRes.data) {
          finalMetrics = { ...finalMetrics, ...metricRes.data };
        }

        // 2. Process all projects for pie chart and total project count
        if (allProjectsRes.success && allProjectsRes.data) {
          const statusCounts = allProjectsRes.data.reduce(
            (acc: Record<string, number>, p: ProjectData) => {
              const rawStatus = p.status?.toUpperCase() || "USULAN";
              const s = STATUS_MAP[rawStatus] || "Planning";
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          setPieData(
            Object.keys(statusCounts).map((key) => ({
              name: key,
              value: statusCounts[key],
            })),
          );

          // Fallback if totalProyek is not provided by agency dashboard API
          if (finalMetrics.totalProyek === 0) {
            finalMetrics.totalProyek = allProjectsRes.data.length;
          }
        }

        // 3. Process priority projects for the table and total participation
        if (priorityRes.success && priorityRes.data) {
          setPriorityProjects(priorityRes.data);

          // Fallback if totalPartisipasi is 0
          if (finalMetrics.totalPartisipasi === 0) {
            finalMetrics.totalPartisipasi = priorityRes.data.reduce(
              (sum: number, p: ProjectData) => sum + (p.totalVotes || 0),
              0,
            );
          }
        }

        // 4. Calculate total funds if the base metrics endpoint returned 0
        if (
          allProjectsRes.success &&
          allProjectsRes.data &&
          finalMetrics.totalDana === 0
        ) {
          const detailedProjects = await Promise.all(
            allProjectsRes.data.map(async (p: ProjectData) => {
              try {
                const detailRes = await apiFetch<ProjectData>(
                  `/api/projects/${p.id}`,
                  { headers },
                );
                return detailRes.success && detailRes.data
                  ? { ...p, ...detailRes.data }
                  : p;
              } catch (e) {
                return p;
              }
            }),
          );
          finalMetrics.totalDana = detailedProjects.reduce(
            (sum: number, p: ProjectData) =>
              sum + Number(p.currentFunding || 0),
            0,
          );
        }

        setMetrics(finalMetrics);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- DERIVED DATA & HELPERS ---

  // Configuration for the 4 top metric cards
  const stats = [
    {
      title: "Total Funds Collected",
      value: `Rp ${metrics.totalDana.toLocaleString("id-ID")}`,
      icon: DollarSign,
      wrapperClass: "border-green-100",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Total Projects",
      value: metrics.totalProyek.toString(),
      icon: FolderGit2,
      wrapperClass: "border-blue-100",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Residents",
      value: metrics.totalWargaAktif.toString(),
      icon: Users,
      wrapperClass: "border-purple-100",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Resident Interactions",
      value: metrics.totalPartisipasi.toString(),
      icon: MessageCircle,
      wrapperClass: "border-orange-100",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  const FirstStatIcon = stats[0].icon;

  // Sorting logic for Priority Projects Table
  const sortedTableData = [...priorityProjects]
    .sort((a, b) => {
      if (sortBy === "viral") {
        return (b.totalVotes || 0) - (a.totalVotes || 0);
      } else {
        const posA = a.sentimentAnalytics?.distribution?.positive || 0;
        const posB = b.sentimentAnalytics?.distribution?.positive || 0;
        if (posB !== posA) return posB - posA;

        const scoreA = a.sentimentAnalytics?.averageScore || 0;
        const scoreB = b.sentimentAnalytics?.averageScore || 0;
        return scoreB - scoreA;
      }
    })
    .slice(0, 10);

  // Formatting Data for the Bar Chart (Sentiment Distribution)
  const sentimentChartData = sortedTableData.slice(0, 5).map((p) => ({
    name: p.title.length > 12 ? p.title.substring(0, 12) + "..." : p.title,
    fullName: p.title,
    Positive: p.sentimentAnalytics?.distribution?.positive || 0,
    Neutral: p.sentimentAnalytics?.distribution?.neutral || 0,
    Negative: p.sentimentAnalytics?.distribution?.negative || 0,
  }));

  // Logic to determine dominant sentiment for the Table badges
  const getDominantSentiment = (distribution?: SentimentDistribution) => {
    if (!distribution) {
      return {
        label: "None",
        color: "bg-gray-100 text-gray-500",
        percentage: 0,
      };
    }

    const { positive, negative, neutral } = distribution;
    const total = positive + negative + neutral;

    if (total === 0) {
      return {
        label: "None",
        color: "bg-gray-100 text-gray-500",
        percentage: 0,
      };
    }

    if (positive >= negative && positive >= neutral) {
      return {
        label: "Positive",
        color: "bg-green-50 text-green-700",
        percentage: Math.round((positive / total) * 100),
      };
    }

    if (negative > positive && negative > neutral) {
      return {
        label: "Negative",
        color: "bg-red-50 text-red-700",
        percentage: Math.round((negative / total) * 100),
      };
    }

    return {
      label: "Neutral",
      color: "bg-gray-100 text-gray-700",
      percentage: Math.round((neutral / total) * 100),
    };
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full flex flex-col w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Summary of statistics and performance of the LIVON platform.
          </p>
        </div>
      </div>

      {/* 1. Top Metrics */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Total Funds Collected Box */}
        <Card
          className={`group relative p-4 ${stats[0].wrapperClass} flex items-center gap-4 lg:w-[40%] shrink-0`}
        >
          {/* Tooltip on Hover */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-md shadow-lg whitespace-nowrap pointer-events-none">
            {stats[0].title}: {stats[0].value}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-gray-900" />
          </div>

          <div
            className={`w-12 h-12 rounded-full ${stats[0].iconBg} flex items-center justify-center shrink-0 ${stats[0].iconColor}`}
          >
            <FirstStatIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
              {stats[0].title}
            </p>
            <p className="text-2xl font-black text-gray-900 truncate">
              {stats[0].value}
            </p>
          </div>
        </Card>

        {/* 3 Remaining Stat Boxes */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.slice(1).map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <Card
                key={idx}
                className={`group relative p-4 ${stat.wrapperClass} flex items-center gap-3`}
              >
                {/* Tooltip on Hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50 px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                  {stat.title}: {stat.value}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-gray-900" />
                </div>

                <div
                  className={`w-10 h-10 rounded-full ${stat.iconBg} flex items-center justify-center shrink-0 ${stat.iconColor}`}
                >
                  <StatIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5 truncate">
                    {stat.title}
                  </p>
                  <p className="text-lg font-black text-gray-900 truncate">
                    {stat.value}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 2. Charts Section (Bar & Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Bar Chart */}
        <Card className="p-6 lg:col-span-2 shadow-sm border-gray-200 flex flex-col min-h-[350px] bg-white">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900">
              Project Sentiment Distribution
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Comparison of comment sentiment on top 5 projects
            </p>
          </div>
          <div className="flex-1 w-full min-h-0 pl-0 mt-2">
            {sentimentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sentimentChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    cursor={{ fill: "#f9fafb" }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return payload[0].payload.fullName || label;
                      }
                      return label;
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
                  />
                  <Bar
                    dataKey="Positive"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 4, 4]}
                    barSize={40}
                  />
                  <Bar dataKey="Neutral" stackId="a" fill="#9ca3af" />
                  <Bar
                    dataKey="Negative"
                    stackId="a"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-400 text-sm font-medium">
                  No sentiment data available
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Project Status Pie Chart */}
        <Card className="p-6 shadow-sm border-gray-200 flex flex-col min-h-[350px] bg-white">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900">Project Status</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Current project proportion distribution
            </p>
          </div>
          <div className="flex-1 flex flex-col mt-2">
            {pieData.length > 0 ? (
              <div className="flex flex-col w-full items-center">
                <div className="w-full h-[180px] flex justify-center items-center relative mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius="65%"
                        outerRadius="90%"
                        dataKey="value"
                        paddingAngle={4}
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={PIE_COLORS[entry.name] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Metric */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      {metrics.totalProyek}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                      Projects
                    </span>
                  </div>
                </div>

                {/* Legend & Breakdown Below Pie Chart */}
                <div className="w-full flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4 border-t border-gray-100">
                  {pieData.map((item) => {
                    const percentage =
                      metrics.totalProyek > 0
                        ? Math.round((item.value / metrics.totalProyek) * 100)
                        : 0;
                    return (
                      <div
                        key={item.name}
                        className="flex flex-col items-center min-w-[60px]"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[item.name] || "#94a3b8",
                            }}
                          />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-gray-900">
                            {item.value}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-sm font-medium text-gray-400">
                  No project data available
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Priority Projects Table */}
      <Card className="p-6 shadow-sm border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
          <div>
            <h3 className="font-bold text-gray-900">
              Top 10 Priority Projects
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Most active projects based on popularity and AI sentiment analysis
            </p>
          </div>
          {/* Table Sorters */}
          <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
            <button
              onClick={() => setSortBy("viral")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                sortBy === "viral"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Most Viral
            </button>
            <button
              onClick={() => setSortBy("sentiment")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                sortBy === "sentiment"
                  ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Positive Sentiment
            </button>
          </div>
        </div>

        {/* Table Rendering */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total Votes</th>
                <th className="py-3 px-4">Dominant Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTableData.length > 0 ? (
                sortedTableData.map((p) => {
                  const sentiment = getDominantSentiment(
                    p.sentimentAnalytics?.distribution,
                  );
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {p.title}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold border-transparent ${
                            p.status === "USULAN"
                              ? "bg-blue-50 text-blue-700"
                              : p.status === "DISETUJUI"
                                ? "bg-yellow-50 text-yellow-700"
                                : p.status === "BERJALAN"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-green-50 text-green-700"
                          }`}
                        >
                          {STATUS_MAP[p.status?.toUpperCase() || "USULAN"] ||
                            "Planning"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {p.totalVotes} Votes
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold border-transparent ${sentiment.color}`}
                        >
                          {sentiment.label}{" "}
                          {sentiment.percentage > 0 && (
                            <span className="opacity-75 ml-1">
                              ({sentiment.percentage}%)
                            </span>
                          )}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-gray-500 text-sm"
                  >
                    No projects meet the criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Quick Actions */}
      <div className="pt-2">
        <h3 className="font-bold text-gray-900 mb-4 text-sm px-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: FolderGit2,
              label: "New Project",
              href: "/admin/projects/create",
              color: "text-green-600",
              hover: "hover:bg-gray-50",
              bgIcon: "bg-green-50",
            },
            {
              icon: MessageSquare,
              label: "Comments",
              href: "/admin/comments",
              color: "text-blue-600",
              hover: "hover:bg-gray-50",
              bgIcon: "bg-blue-50",
            },
            {
              icon: DollarSign,
              label: "Donations",
              href: "/admin/crowdfunding",
              color: "text-yellow-600",
              hover: "hover:bg-gray-50",
              bgIcon: "bg-yellow-50",
            },
            {
              icon: Users,
              label: "Residents",
              href: "/admin/users",
              color: "text-purple-600",
              hover: "hover:bg-gray-50",
              bgIcon: "bg-purple-50",
            },
          ].map((action) => {
            const ActionIcon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 transition-all group ${action.hover} shadow-sm`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg transition-colors group-hover:bg-white ${action.bgIcon}`}
                  >
                    <ActionIcon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {action.label}
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
