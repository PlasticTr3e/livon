"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, cn } from "@/components/ui/WireframePrimitives";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  FileText,
  Banknote,
  HardHat,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    style: string;
    dot: string;
    iconBg: string;
    iconColor: string;
    border: string;
  }
> = {
  USULAN: {
    label: "Planning",
    style: "bg-blue-50 text-blue-600 border-blue-100",
    dot: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    border: "border-blue-100",
  },
  DISETUJUI: {
    label: "Funding",
    style: "bg-yellow-50 text-yellow-700 border-yellow-100",
    dot: "bg-yellow-600",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    border: "border-yellow-100",
  },
  BERJALAN: {
    label: "Construction",
    style: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-600",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    border: "border-orange-100",
  },
  SELESAI: {
    label: "Completed",
    style: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-600",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-100",
  },
};

interface ProjectAdmin {
  id: string;
  name: string;
  status: string;
  budget: string;
  votes: number;
  date: string;
  category: string;
}

export default function ProjectManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [allProjectsData, setAllProjectsData] = useState<ProjectAdmin[]>([]);
  const [projects, setProjects] = useState<ProjectAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const json = await res.json();

        if (json.data) {
          const fullProjects = await Promise.all(
            json.data.map(async (p: { id: string }) => {
              try {
                const detailRes = await fetch(`/api/projects/${p.id}`);
                const detailJson = await detailRes.json();
                const d = detailJson.data;
                if (!d) return null;

                let budgetFormatted = "Rp 0";
                if (d.budgetTarget) {
                  budgetFormatted = `Rp ${Number(d.budgetTarget).toLocaleString("id-ID")}`;
                }

                return {
                  id: d.id,
                  name: d.title,
                  status: d.status || "USULAN",
                  budget: budgetFormatted,
                  votes: d._count?.votes || 0,
                  date: new Date(d.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                  category: d.category?.name || "Uncategorized",
                };
              } catch {
                return null;
              }
            }),
          );

          const validProjects = fullProjects.filter(Boolean) as ProjectAdmin[];
          setAllProjectsData(validProjects);
          setProjects(validProjects);
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this project?")) {
      try {
        const token = localStorage.getItem("livon-token");
        const res = await fetch(`/api/projects/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          setAllProjectsData((prev) => prev.filter((p) => p.id !== id));
        }
      } catch {
        alert("Deletion failed.");
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "USULAN":
        return <FileText className="w-5 h-5" />;
      case "DISETUJUI":
        return <Banknote className="w-5 h-5" />;
      case "BERJALAN":
        return <HardHat className="w-5 h-5" />;
      case "SELESAI":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto w-full font-sans antialiased">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Project Management
            </h1>
            <p className="text-gray-500 dark:text-white text-sm mt-0.5">
              Monitor and manage community development initiatives.
            </p>
          </div>
          <Link href="/admin/projects/create">
            <Button
              variant="primary"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-sm h-11 px-6 rounded-xl font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["USULAN", "DISETUJUI", "BERJALAN", "SELESAI"].map((status) => {
            const count = allProjectsData.filter(
              (p) => p.status === status,
            ).length;
            const config = STATUS_CONFIG[status];

            return (
              <Card
                key={status}
                className={cn(
                  "p-5 border-green-100 dark:border-gray-800 flex items-center gap-4 bg-white dark:bg-[#1F2937] shadow-sm rounded-2xl",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-inner",
                    config.iconBg,
                    config.iconColor,
                  )}
                >
                  {getStatusIcon(status)}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-medium text-gray-400 dark:text-white tracking-widest mb-0.5">
                    {config.label}
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                    {isLoading ? "..." : count}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">
            Project Dashboard
          </h2>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="pl-9 border-green-200 w-full h-11 rounded-xl text-xs font-medium"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-40 md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-11 pl-9 pr-8 bg-white dark:bg-[#1F2937] border border-green-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="All">All Status</option>
                <option value="USULAN">Planning</option>
                <option value="DISETUJUI">Funding</option>
                <option value="BERJALAN">Construction</option>
                <option value="SELESAI">Completed</option>
              </select>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <Card className="p-5 border-green-100 dark:border-gray-800 shadow-sm bg-white dark:bg-[#1F2937] overflow-hidden rounded-2xl">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-gray-400 dark:text-white font-semibold uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                  <th className="py-4 px-8">Project Details</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Category</th>
                  <th className="py-4 px-4">Budget</th>
                  <th className="py-4 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-24 text-center text-gray-400 dark:text-white font-medium uppercase tracking-widest text-[10px]"
                    >
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors group cursor-pointer"
                      onClick={() =>
                        router.push(`/project/${project.id}?from=admin`)
                      }
                    >
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                            {project.name}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-white font-medium mt-1">
                            Created {project.date}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex justify-center">
                          <div
                            className={cn(
                              "px-4 py-1.5 text-[10px] font-semibold rounded-full flex items-center justify-center border",
                              STATUS_CONFIG[project.status].style,
                            )}
                          >
                            {STATUS_CONFIG[project.status].label}
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex justify-center">
                          <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-white border border-slate-100 dark:border-slate-700 px-4 py-1 rounded-full text-[10px] font-semibold">
                            {project.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-gray-700 dark:text-white font-semibold text-xs">
                        {project.budget}
                      </td>
                      <td className="py-6 px-8">
                        <div
                          className="flex items-center justify-end gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/admin/projects/${project.id}?mode=edit`}
                          >
                            <button className="p-2.5 rounded-xl bg-white dark:bg-[#1F2937] border border-gray-100 dark:border-gray-800 text-green-600 dark:text-green-400 hover:bg-green-600 dark:hover:bg-green-700 hover:text-white transition-all shadow-sm">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2.5 rounded-xl bg-white dark:bg-[#1F2937] border border-gray-100 dark:border-gray-800 text-red-500 dark:text-red-400 hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
