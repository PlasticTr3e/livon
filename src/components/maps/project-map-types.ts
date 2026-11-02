import type { ProjectStage } from "@/lib/project-lifecycle";

export type ProjectMapStatus = ProjectStage;

export type ProjectMapMarker = {
  id: string;
  name: string;
  status: string;
  address: string;
  lat?: number;
  lng?: number;
};
