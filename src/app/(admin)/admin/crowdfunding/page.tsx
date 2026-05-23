"use client";
import { useState, useEffect } from "react";
import { Card, Badge, cn, Input } from "@/components/ui/WireframePrimitives";
import {
  DollarSign,
  Clock,
  BarChart2,
  Search,
  Filter,
  ArrowLeft,
  ArrowRightLeft,
  SearchX,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

// --- TYPES ---

interface ProjectData {
  id: string;
  title: string;
  status?: string;
  budgetTarget?: number;
  currentFunding?: number;
}

interface Transaction {
  id: string;
  user: string;
  project: string;
  projectId: string;
  amount: number;
  date: string;
  rawDate: Date;
  status: "Success" | "Pending" | "Failed";
}

interface RawDonation {
  id: string;
  orderId?: string;
  projectId?: string;
  user?: {
    citizenProfile?: {
      fullName?: string;
    };
  };
  project?: {
    id?: string;
    title?: string;
  };
  amount: number | string;
  createdAt: string | Date;
  status: string;
}

export default function CrowdfundingMonitorPage() {
  // --- STATE MANAGEMENT ---

  // 1. Data State
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. View State (Main Dashboard vs Project Details)
  const [selectedProject, setSelectedProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 3. Filters & Sorting State
  const [projectStatusFilter, setProjectStatusFilter] = useState<
    "active" | "completed"
  >("active");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const [transactionSort, setTransactionSort] = useState<
    "latest" | "oldest" | "highest" | "lowest"
  >("latest");
  const [transactionSearchQuery, setTransactionSearchQuery] = useState("");

  // --- DATA FETCHING ---

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch all projects and enrich with detailed data
        const projectRes = await apiFetch<ProjectData[]>("/api/projects", {
          headers,
        });
        if (projectRes.success && projectRes.data) {
          const detailedProjects = await Promise.all(
            projectRes.data.map(async (project) => {
              try {
                const detailRes = await apiFetch<ProjectData>(
                  `/api/projects/${project.id}`,
                  { headers },
                );
                if (detailRes.success && detailRes.data) {
                  return { ...project, ...detailRes.data };
                }
              } catch (e) {
                console.error(
                  `Failed to fetch details for project ${project.id}:`,
                  e,
                );
              }
              return project;
            }),
          );
          setProjects(detailedProjects);
        }

        // Fetch all donations/transactions
        const donationRes = await apiFetch<RawDonation[]>("/api/donations", {
          headers,
        });
        if (donationRes.success && donationRes.data) {
          const mappedTransactions: Transaction[] = donationRes.data.map(
            (d) => {
              const rawDate = new Date(d.createdAt);
              return {
                id: d.orderId || d.id,
                user: d.user?.citizenProfile?.fullName || "Anonymous Resident",
                project: d.project?.title || "Unknown Project",
                projectId: d.projectId || d.project?.id || "",
                amount: Number(d.amount),
                rawDate,
                date: rawDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                status:
                  d.status === "SUCCESS"
                    ? "Success"
                    : d.status === "FAILED"
                      ? "Failed"
                      : "Pending",
              };
            },
          );
          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- DERIVED DATA (STATISTICS & FILTERS) ---

  // Dashboard Overview Stats
  const activeCampaignsCount = projects.filter(
    (p) => p.status?.toUpperCase() === "DISETUJUI",
  ).length;

  const pendingVerificationCount = projects.filter(
    (p) => p.status?.toUpperCase() === "USULAN",
  ).length;

  const totalCollected = projects.reduce(
    (sum, p) => sum + (Number(p.currentFunding) || 0),
    0,
  );

  // Helper for Transaction Status Styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Success":
        return "bg-green-100 text-green-700 border-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Failed":
        return "bg-red-100 text-red-600 border-red-300";
      default:
        return "bg-gray-100 text-gray-600 dark:text-white";
    }
  };

  // Helper for Project Status Translation
  const getDisplayStatus = (status?: string) => {
    const s = status?.toUpperCase() || "";
    if (s === "DISETUJUI") return "Active";
    if (s === "SELESAI") return "Completed";
    if (s === "KONSTRUKSI") return "In Construction";
    if (s === "USULAN") return "Pending";
    return status;
  };

  // Filtered Projects for the Dashboard Grid
  const dashboardProjects = projects.filter((p) => {
    const s = p.status?.toUpperCase() || "";

    // Filter by Dropdown Status
    if (projectStatusFilter === "active" && s !== "DISETUJUI") return false;
    if (
      projectStatusFilter === "completed" &&
      s !== "SELESAI" &&
      s !== "KONSTRUKSI"
    )
      return false;

    // Filter by Search Query
    if (
      projectSearchQuery &&
      !p.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Filtered & Sorted Transactions for the Selected Project View
  const projectTransactions = transactions
    .filter(
      (t) =>
        t.projectId === selectedProject?.id ||
        t.project === selectedProject?.name,
    )
    .filter((t) => {
      // Filter by Search Query (Donor Name or Transaction ID)
      if (
        transactionSearchQuery &&
        !t.user.toLowerCase().includes(transactionSearchQuery.toLowerCase()) &&
        !t.id.toLowerCase().includes(transactionSearchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Apply Sorting Rules
      if (transactionSort === "latest")
        return b.rawDate.getTime() - a.rawDate.getTime();
      if (transactionSort === "oldest")
        return a.rawDate.getTime() - b.rawDate.getTime();
      if (transactionSort === "highest") return b.amount - a.amount;
      if (transactionSort === "lowest") return a.amount - b.amount;
      return 0;
    });

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-[#0B1120] min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-white font-medium">
            Loading data...
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto w-full">
      {/* Dynamic Header for Project Details View */}
      {selectedProject && (
        <div className="sticky top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center shadow-sm">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Back to Dashboard</span>
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        {/* Page Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              {selectedProject
                ? "Transaction History"
                : "Crowdfunding Management"}
            </h1>
            <p className="text-gray-500 dark:text-white text-sm mt-0.5">
              {selectedProject
                ? `Viewing transactions for "${selectedProject.name}"`
                : "Track all donations and funding progress."}
            </p>
          </div>
        </div>

        {!selectedProject ? (
          <div className="space-y-6">
            {/* 1. Global Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-green-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Total Collected
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    Rp {totalCollected.toLocaleString("id-ID")}
                  </p>
                </div>
              </Card>

              <Card className="p-4 border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Active Campaigns
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {activeCampaignsCount}
                  </p>
                </div>
              </Card>

              <Card className="p-4 border-yellow-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Waiting Verification
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {pendingVerificationCount}
                  </p>
                </div>
              </Card>
            </div>

            {/* 2. Global Recent Transactions Widget */}
            <Card className="p-6 border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Recent Transactions
                </h3>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-white text-sm">
                    No transaction data yet
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-white font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {transactions.slice(0, 3).map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-green-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-gray-800 dark:text-white">
                            {row.user}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-white text-xs">
                            {row.project}
                          </td>
                          <td className="py-3 px-4 font-black text-green-700">
                            Rp {row.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-white text-xs">
                            {row.date}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={cn(
                                "text-[10px]",
                                getStatusStyle(row.status),
                              )}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* 3. Projects Dashboard Section (Grid) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Donation Dashboard
              </h2>

              {/* Project Filters & Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white" />
                  <Input
                    className="pl-9 border-green-200 w-full"
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative w-40">
                  <select
                    value={projectStatusFilter}
                    onChange={(e) =>
                      setProjectStatusFilter(
                        e.target.value as "active" | "completed",
                      )
                    }
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-[#1F2937] border border-green-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardProjects.length > 0 ? (
                dashboardProjects.map((p) => {
                  const target = Number(p.budgetTarget) || 0;
                  const collected = Number(p.currentFunding) || 0;
                  const progress =
                    target > 0
                      ? Math.min(Math.round((collected / target) * 100), 100)
                      : 0;

                  return (
                    <Card
                      key={p.id}
                      className="p-5 border-green-100 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                      onClick={() =>
                        setSelectedProject({ id: p.id, name: p.title })
                      }
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <Badge
                          className={cn(
                            "text-[9px] px-1.5",
                            projectStatusFilter === "active"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-blue-100 text-blue-700 border-blue-300",
                          )}
                        >
                          {getDisplayStatus(p.status)}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-green-700 transition-colors line-clamp-2 mb-4 flex-1">
                        {p.title}
                      </h3>

                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-500 dark:text-white">
                            Collected:
                          </span>
                          <span className="text-green-700 font-bold">
                            Rp {collected.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              projectStatusFilter === "active"
                                ? "bg-gradient-to-r from-green-400 to-yellow-400"
                                : "bg-blue-500",
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-white font-medium">
                          <span>{progress}% funded</span>
                          <span>
                            Target: Rp {target.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 dark:text-white gap-3 bg-white dark:bg-[#1F2937] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  <SearchX className="w-12 h-12 opacity-20" />
                  <p className="font-medium">No projects found.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 4. Detailed Transaction Table (Shown when a Project is clicked) */
          <Card className="p-5 border-green-100 shadow-sm">
            {/* Transaction Filters & Sorting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white" />
                <Input
                  className="pl-9 border-green-200 w-full"
                  placeholder="Search donor or TRX ID..."
                  value={transactionSearchQuery}
                  onChange={(e) => setTransactionSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <select
                    value={transactionSort}
                    onChange={(e) =>
                      setTransactionSort(
                        e.target.value as
                          | "latest"
                          | "oldest"
                          | "highest"
                          | "lowest",
                      )
                    }
                    className="w-full h-10 pl-10 pr-8 bg-white dark:bg-[#1F2937] border border-green-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="latest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                    <ArrowRightLeft className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {projectTransactions.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-white font-medium">
                  No transactions found for this project.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-white font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">TRX ID</th>
                      <th className="py-3 px-4">Donor</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {projectTransactions.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-green-50 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500 dark:text-white">
                          {row.id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-white">
                          {row.user}
                        </td>
                        <td className="py-3.5 px-4 font-black text-green-700">
                          Rp {row.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 dark:text-white text-xs">
                          {row.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              getStatusStyle(row.status),
                            )}
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
