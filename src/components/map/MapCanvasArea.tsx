"use client";

import { memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapLoadingPlaceholder } from "./MapLoadingPlaceholder";
import { MapLegend } from "./MapLegend";
import type { MapProject } from "@/lib/map/map-types";

const ProjectMap = dynamic(() => import("@/components/maps/ProjectMap"), {
  ssr: false,
  loading: () => <MapLoadingPlaceholder />,
});

type MapCanvasAreaProps = {
  isLoading: boolean;
  isSidebarOpen: boolean;
  projects: MapProject[];
  selectedProjectId?: string;
  onProjectSelect: (project: MapProject) => void;
};

export const MapCanvasArea = memo(function MapCanvasArea({
  isLoading,
  isSidebarOpen,
  projects,
  selectedProjectId,
  onProjectSelect,
}: MapCanvasAreaProps) {
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const handleProjectSelect = useCallback(
    (project: { id: string }) => {
      const fullProject = projectsById.get(project.id);
      if (fullProject) onProjectSelect(fullProject);
    },
    [onProjectSelect, projectsById],
  );

  return (
    <div className="relative h-full w-full">
      {!isLoading && (
        <ProjectMap
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectSelect={handleProjectSelect}
        />
      )}
      <MapLegend isHidden={isSidebarOpen} />
    </div>
  );
});
