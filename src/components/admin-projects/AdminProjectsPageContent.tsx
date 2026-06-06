"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  formatAdminProjectBudget,
  formatAdminProjectDate,
  isAdminProjectStatus,
} from "@/lib/admin-projects/admin-projects-format";
import type {
  AdminProjectStatus,
  AdminProjectSummary,
} from "@/lib/admin-projects/admin-projects-types";
import { AdminProjectsHeader } from "./AdminProjectsHeader";
import { AdminProjectsStats } from "./AdminProjectsStats";
import { AdminProjectsTable } from "./AdminProjectsTable";
import { AdminProjectsToolbar } from "./AdminProjectsToolbar";

export function AdminProjectsPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | AdminProjectStatus>(
    "All",
  );
  const [allProjectsData, setAllProjectsData] = useState<AdminProjectSummary[]>(
    [],
  );
  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
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

                const status = isAdminProjectStatus(d.status)
                  ? d.status
                  : "USULAN";

                return {
                  id: d.id,
                  name: d.title,
                  status,
                  budget: formatAdminProjectBudget(d.budgetTarget),
                  votes: d._count?.votes || 0,
                  date: formatAdminProjectDate(d.createdAt),
                  category: d.category?.name || "Uncategorized",
                };
              } catch {
                return null;
              }
            }),
          );

          const validProjects = fullProjects.filter(
            Boolean,
          ) as AdminProjectSummary[];
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

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 font-sans antialiased dark:bg-[#0B1120]">
      <div className="space-y-6 p-6 md:p-8">
        <AdminProjectsHeader />
        <AdminProjectsStats isLoading={isLoading} projects={allProjectsData} />
        <AdminProjectsToolbar
          filterStatus={filterStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onStatusChange={setFilterStatus}
        />
        <AdminProjectsTable
          isLoading={isLoading}
          projects={filtered}
          onDelete={handleDelete}
          onView={(projectId) =>
            router.push(`/project/${projectId}?from=admin`)
          }
        />
      </div>
    </div>
  );
}
