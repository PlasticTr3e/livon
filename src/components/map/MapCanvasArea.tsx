"use client";

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
  selectedProject: MapProject | null;
  onProjectSelect: (project: MapProject) => void;
};

export function MapCanvasArea({
  isLoading,
  isSidebarOpen,
  projects,
  selectedProject,
  onProjectSelect,
}: MapCanvasAreaProps) {
  return (
    <div className="relative h-full w-full">
      {!isLoading && (
        <ProjectMap
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={(project: { id: string }) => {
            const fullProject = projects.find((item) => item.id === project.id);
            if (fullProject) onProjectSelect(fullProject);
          }}
        />
      )}
      <MapLegend isHidden={isSidebarOpen} />
    </div>
  );
}
