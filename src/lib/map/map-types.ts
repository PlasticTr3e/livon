import type { ProjectStage } from "@/lib/project-lifecycle";

export type MapProjectStatus = ProjectStage;

export type MapStatusFilter = "All" | MapProjectStatus;

export type MapComment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
};

export type MapProject = {
  id: string;
  name: string;
  address: string;
  category: string;
  status: MapProjectStatus;
  progress: number;
  budget: number;
  fundsCollected: number;
  comments: MapComment[];
  lat: number;
  lng: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  estimatedDurationDays?: number;
};
