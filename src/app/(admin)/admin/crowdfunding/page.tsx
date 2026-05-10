"use client";
import { useState, useEffect } from "react";
import { Card, Button, Badge, cn } from "@/components/ui/WireframePrimitives";
import {
  Download,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

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
  amount: number;
  date: string;
  status: "Success" | "Pending" | "Failed";
}

interface RawDonation {
  id: string;
  orderId?: string;
  user?: {
    citizenProfile?: {
      fullName?: string;
    };
  };
  project?: {
    title?: string;
  };
  amount: number | string;
  createdAt: string | Date;
  status: string;
}

export default function CrowdfundingMonitorPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects and transactions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. Fetch Projects
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

        // 2. Fetch Transactions (Donations)
        const donationRes = await apiFetch<RawDonation[]>("/api/donations", {
          headers,
        });
        if (donationRes.success && donationRes.data) {
          // Mapping data dari backend ke format tabel UI
          const mappedTransactions: Transaction[] = donationRes.data.map(
            (d) => ({
              id: d.orderId || d.id, // Pakai orderId Midtrans agar lebih mudah dilacak
              user: d.user?.citizenProfile?.fullName || "Anonymous Resident",
              project: d.project?.title || "Unknown Project",
              amount: Number(d.amount),
              date: new Date(d.createdAt).toLocaleDateString("id-ID", {
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
            }),
          );
          setTransactions(mappedTransactions);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter active/approved campaigns
  const activeCampaigns = projects.filter(
    (p) => p.status && p.status.toUpperCase() === "DISETUJUI",
  );

  // Calculate stats
  const totalCollected = projects.reduce(
    (sum, p) => sum + (Number(p.currentFunding) || 0),
    0,
  );
  const activeCampaignCount = activeCampaigns.length;
  const pendingVerificationCount = projects.filter(
    (p) => p.status?.toUpperCase() === "USULAN",
  ).length;

  const statusStyle = (s: string) => {
    switch (s) {
      case "Success":
        return "bg-green-100 text-green-700 border-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Failed":
        return "bg-red-100 text-red-600 border-red-300";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Transaction ID",
      "Donor",
      "Campaign",
      "Donation Amount (Rp)",
      "Time",
      "Status",
    ];

    const rows = transactions.map((t) => [
      t.id,
      `"${t.user.replace(/"/g, '""')}"`,
      `"${t.project.replace(/"/g, '""')}"`,
      t.amount.toString(),
      `"${t.date}"`,
      t.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `donation_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">
            Loading crowdfunding data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Crowdfunding Monitor
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Track all donations and funding progress.
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-green-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                Total Collected
              </p>
              <p className="text-3xl font-black text-green-800">
                Rp {totalCollected.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> From {projects.length}{" "}
                projects
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-blue-100 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                Active Campaigns
              </p>
              <p className="text-3xl font-black text-blue-800">
                {activeCampaignCount}
              </p>
              <p className="text-xs text-blue-600 mt-1">In funding stage</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-yellow-100 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Waiting for Verification
              </p>
              <p className="text-3xl font-black text-yellow-800">
                {pendingVerificationCount}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Needs follow-up</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Campaign Progress */}
      <Card className="p-6 border-green-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">
          Active Campaign Progress
        </h3>
        {activeCampaigns.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            No active campaigns
          </p>
        ) : (
          <div className="space-y-6">
            {activeCampaigns.map((campaign) => {
              const target = Number(campaign.budgetTarget) || 0;
              const collected = Number(campaign.currentFunding) || 0;
              const progress =
                target > 0
                  ? Math.min(Math.round((collected / target) * 100), 100)
                  : 0;

              return (
                <div key={campaign.id}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-800">
                      {campaign.title}
                    </p>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                      Collected:{" "}
                      <strong className="text-green-700">
                        Rp {collected.toLocaleString("id-ID")}
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      Target:{" "}
                      <strong>Rp {target.toLocaleString("id-ID")}</strong>
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{progress}% achieved</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Transactions Table */}
      <Card className="p-6 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Recent Transactions</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {transactions.length} transactions
          </span>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm mb-2">
              No transaction data yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">TRX ID</th>
                  <th className="py-3 px-4">Donor</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-green-50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                      {row.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {row.user}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs">
                      {row.project}
                    </td>
                    <td className="py-3.5 px-4 font-black text-green-700">
                      Rp {row.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {row.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className={cn("text-xs", statusStyle(row.status))}>
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
    </div>
  );
}
