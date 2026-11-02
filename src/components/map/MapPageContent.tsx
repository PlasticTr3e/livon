"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/shared/AppToaster";
import { fetchMapProjects, getStoredMapToken } from "@/lib/map/map-api";
import { filterMapProjects } from "@/lib/map/map-format";
import type { MapProject, MapStatusFilter } from "@/lib/map/map-types";
import { MapCanvasArea } from "./MapCanvasArea";
import { MapProjectDetailPanel } from "./MapProjectDetailPanel";
import { MapSidebar } from "./MapSidebar";

export function MapPageContent() {
  const router = useRouter();
  const { userRole } = useUser();
  const toast = useToast();
  const [projects, setProjects] = useState<MapProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<MapStatusFilter>("All");

  useEffect(() => {
    const handleToggle = () =>
      setSidebarOpen((isOpen) => {
        if (!isOpen) {
          setSelectedProject(null);
        }

        return !isOpen;
      });

    window.addEventListener("toggle-app-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-app-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    async function loadProjects() {
      try {
        const token = getStoredMapToken();
        const nextProjects = await fetchMapProjects(token);
        setProjects(nextProjects);
      } catch (error) {
        console.error("Failed to fetch map projects", error);
        toast.error("Map failed to load", "Please refresh and try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProjects();
  }, [toast, userRole]);

  const filteredProjects = useMemo(
    () =>
      filterMapProjects({
        projects,
        searchQuery,
        status: filterStatus,
      }),
    [filterStatus, projects, searchQuery],
  );

  const handleProjectCardClick = useCallback(
    (project: MapProject) => {
      if (window.innerWidth < 768) {
        router.push(`/project/${project.id}`);
        return;
      }

      setSelectedProject(project);
    },
    [router],
  );

  const handleMapProjectSelect = useCallback((project: MapProject) => {
    setSidebarOpen(false);
    setSelectedProject(project);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleSeeComments = useCallback(
    (projectId: string) => router.push(`/project/${projectId}#comments`),
    [router],
  );

  const handleViewDetail = useCallback(
    (projectId: string) => router.push(`/project/${projectId}`),
    [router],
  );

  return (
    <div className="relative flex h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
      <MapSidebar
        filterStatus={filterStatus}
        isLoading={isLoading}
        isOpen={sidebarOpen}
        projects={filteredProjects}
        searchQuery={searchQuery}
        selectedProjectId={selectedProject?.id}
        onClose={handleSidebarClose}
        onProjectSelect={handleProjectCardClick}
        onSearchChange={setSearchQuery}
        onStatusChange={setFilterStatus}
      />

      <div className="relative flex h-full flex-1 flex-col">
        <MapCanvasArea
          isLoading={isLoading}
          isSidebarOpen={sidebarOpen}
          projects={filteredProjects}
          selectedProjectId={selectedProject?.id}
          onProjectSelect={handleMapProjectSelect}
        />

        {selectedProject && (
          <MapProjectDetailPanel
            project={selectedProject}
            userRole={userRole}
            onClose={handlePanelClose}
            onSeeComments={handleSeeComments}
            onViewDetail={handleViewDetail}
          />
        )}
      </div>
    </div>
  );
}
