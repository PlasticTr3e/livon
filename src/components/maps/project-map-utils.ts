import type { ProjectMapStatus } from "./project-map-types";

export const HOUSING_AREA_BOUNDS: [[number, number], [number, number]] = [
  [-6.944, 107.7725],
  [-6.9385, 107.7785],
];

export const DEFAULT_PROJECT_COORDINATES: [number, number] = [-6.941, 107.7755];

const markerColors: Record<ProjectMapStatus, string> = {
  Planning: "#3b82f6",
  Funding: "#eab308",
  Construction: "#f97316",
  "Under Construction": "#f97316",
  Completed: "#22c55e",
};

export function getProjectMarkerColor(status?: string) {
  return markerColors[status as ProjectMapStatus] ?? "#6b7280";
}

export function getFallbackProjectCoordinates(index: number): [number, number] {
  return [-6.9411 + index * 0.001 - 0.002, 107.7756 + index * 0.001 - 0.0015];
}
