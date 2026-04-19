"use client";
import { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Input,
  cn,
} from "@/components/ui/WireframePrimitives";
import { Search, Plus, Edit2, Trash2, Eye } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  USULAN: "bg-blue-100 text-blue-700 border-blue-300",
  DISETUJUI: "bg-yellow-100 text-yellow-700 border-yellow-300",
  BERJALAN: "bg-orange-100 text-orange-700 border-orange-300",
  SELESAI: "bg-green-100 text-green-700 border-green-300",
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
                  const num = Number(d.budgetTarget);
                  if (num >= 1000000) {
                    budgetFormatted = `Rp ${(num / 1000000).toFixed(0)}M`;
                  } else {
                    budgetFormatted = `Rp ${num.toLocaleString("id-ID")}`;
                  }
                }

                return {
                  id: d.id,
                  name: d.title,
                  status: d.status || "USULAN",
                  budget: budgetFormatted,
                  votes: d._count?.votes || 0,
                  date: new Date(d.createdAt).toISOString().split("T")[0],
                  category: d.category?.name || "Uncategorized",
                };
              } catch (e) {
                console.error("Error fetching project details for id", p.id, e);
                return null;
              }
            }),
          );

          const validProjects = fullProjects.filter(Boolean);
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

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus proyek ini?")) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setAllProjectsData((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Manajemen Proyek
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Kelola semua proyek komunitas.
          </p>
        </div>
        {/* "Create New Project" button is here — not in the sidebar */}
        <Link href="/admin/projects/create">
          <Button
            variant="primary"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Proyek Baru</span>
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["All", "USULAN", "DISETUJUI", "BERJALAN", "SELESAI"]
          .slice(1)
          .map((status) => {
            const count = allProjectsData.filter(
              (p) => p.status === status,
            ).length;
            return (
              <button
                key={status}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "All" : status)
                }
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  filterStatus === status ? "ring-2 ring-green-300" : "",
                  STATUS_STYLES[status] || "bg-white border-gray-200",
                )}
              >
                <p className="text-xl font-black">
                  {isLoading ? "..." : count}
                </p>
                <p className="text-xs font-semibold mt-0.5">{status}</p>
              </button>
            );
          })}
      </div>

      <Card className="p-5 border-gray-200 shadow-sm">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 bg-white border-green-200 focus:ring-green-400 w-full"
              placeholder="Cari proyek atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 text-sm border border-green-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">Semua Status</option>
              <option value="USULAN">Usulan</option>
              <option value="DISETUJUI">Disetujui</option>
              <option value="BERJALAN">Berjalan</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Proyek</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Anggaran</th>
                <th className="py-3 px-4">Votes</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    Memuat data proyek...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    Tidak ada proyek yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-green-50 transition-colors group"
                  >
                    <td className="py-4 px-4 font-semibold text-gray-900 group-hover:text-green-800">
                      {project.name}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={cn(
                          "px-2.5 py-1 text-xs",
                          STATUS_STYLES[project.status],
                        )}
                      >
                        {project.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                        {project.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {project.budget}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-green-600">
                        {project.votes}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-500 text-xs">
                      {project.date}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/app/project/${project.id}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/admin/projects/${project.id}?mode=edit`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>
            Menampilkan {filtered.length} dari {projects.length} proyek
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              className="px-3 py-1 h-8 text-xs border-green-200 text-green-700"
            >
              Sebelumnya
            </Button>
            <Button
              variant="primary"
              className="px-3 py-1 h-8 text-xs bg-green-600"
            >
              1
            </Button>
            <Button
              variant="outline"
              className="px-3 py-1 h-8 text-xs border-green-200 text-green-700"
            >
              2
            </Button>
            <Button
              variant="outline"
              className="px-3 py-1 h-8 text-xs border-green-200 text-green-700"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
