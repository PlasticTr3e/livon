"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/shared/AppToaster";
import {
  fetchCurrentUserVotes,
  fetchMapProjects,
  getStoredMapToken,
  submitMapProjectVote,
} from "@/lib/map/map-api";
import { filterMapProjects, updateMapProjectVotes } from "@/lib/map/map-format";
import type {
  MapProject,
  MapStatusFilter,
  MapVoteChoice,
} from "@/lib/map/map-types";
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
  const [userVotes, setUserVotes] = useState<Record<string, MapVoteChoice>>({});
  const [savingVotes, setSavingVotes] = useState<Record<string, boolean>>({});

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

        if (token && userRole === "resident") {
          const nextUserVotes = await fetchCurrentUserVotes(token);
          setUserVotes(nextUserVotes);
        }
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

  async function handleVote(projectId: string, voteType: MapVoteChoice) {
    if (!userRole || userRole !== "resident") {
      toast.error("Voting unavailable", "Only residents can vote.");
      return;
    }

    if (savingVotes[projectId]) return;

    const token = getStoredMapToken();
    if (!token) {
      toast.error("Login required", "Please log in to vote.");
      return;
    }

    setSavingVotes((prev) => ({ ...prev, [projectId]: true }));

    try {
      const currentVote = userVotes[projectId];
      const { nextVote, agreeDelta, disagreeDelta } =
        await submitMapProjectVote({
          currentVote,
          projectId,
          token,
          voteType,
        });

      setUserVotes((prev) => {
        const next = { ...prev };
        if (nextVote) next[projectId] = nextVote;
        else delete next[projectId];
        return next;
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? updateMapProjectVotes(project, agreeDelta, disagreeDelta)
            : project,
        ),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId
          ? updateMapProjectVotes(prev, agreeDelta, disagreeDelta)
          : prev,
      );
      toast.success("Success", "Vote saved.");
    } catch (error) {
      console.error(error);
      toast.error("Vote failed", "Failed to save vote. Please try again.");
    } finally {
      setSavingVotes((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  function handleProjectCardClick(project: MapProject) {
    if (window.innerWidth < 768) {
      router.push(`/project/${project.id}`);
      return;
    }

    setSelectedProject(project);
  }

  function handleMapProjectSelect(project: MapProject) {
    setSidebarOpen(false);
    setSelectedProject(project);
  }

  return (
    <div className="relative flex h-full overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
      <MapSidebar
        filterStatus={filterStatus}
        isLoading={isLoading}
        isOpen={sidebarOpen}
        projects={filteredProjects}
        searchQuery={searchQuery}
        selectedProjectId={selectedProject?.id}
        onClose={() => setSidebarOpen(false)}
        onProjectSelect={handleProjectCardClick}
        onSearchChange={setSearchQuery}
        onStatusChange={setFilterStatus}
      />

      <div className="relative flex h-full flex-1 flex-col">
        <MapCanvasArea
          isLoading={isLoading}
          isSidebarOpen={sidebarOpen}
          projects={filteredProjects}
          selectedProject={selectedProject}
          onProjectSelect={handleMapProjectSelect}
        />

        {selectedProject && (
          <MapProjectDetailPanel
            project={selectedProject}
            savingVotes={savingVotes}
            userRole={userRole}
            userVotes={userVotes}
            onClose={() => setSelectedProject(null)}
            onDonate={(projectId) => router.push(`/crowdfunding/${projectId}`)}
            onSeeComments={(projectId) =>
              router.push(`/project/${projectId}#comments`)
            }
            onViewDetail={(projectId) => router.push(`/project/${projectId}`)}
            onVote={handleVote}
          />
        )}
      </div>
    </div>
  );
}
