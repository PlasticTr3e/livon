export type MapProjectStatus =
  | "Planning"
  | "Funding"
  | "Construction"
  | "Completed";

export type MapStatusFilter = "All" | MapProjectStatus;

export type MapVoteChoice = "agree" | "disagree";

export type MapVoteAction = "CREATED" | "UPDATED" | "DELETED";

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
  votes: { agree: number; disagree: number };
  comments: MapComment[];
  lat: number;
  lng: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  estimatedDurationDays?: number;
};

export type ActivityFeedItem = {
  type?: string;
  action?: string;
  targetId?: string | null;
};

export type VoteDelta = {
  nextVote: MapVoteChoice | null;
  agreeDelta: number;
  disagreeDelta: number;
};
