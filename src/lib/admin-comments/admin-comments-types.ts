export type AdminCommentRole = "resident" | "agency";
export type AdminCommentSentiment = "Positive" | "Negative" | "Neutral";
export type AdminCommentProjectSort =
  | "latest"
  | "oldest"
  | "positive"
  | "negative";
export type AdminCommentSentimentFilter =
  | "all"
  | AdminCommentSentiment
  | "flagged";

export type AdminCommentItem = {
  id: string;
  author: string;
  text: string;
  role: AdminCommentRole;
  projectName: string;
  projectId: string | null;
  flag: boolean;
  userId: string;
  createdAt: string;
  sentiment: AdminCommentSentiment;
};

export type AdminCommentProject = {
  id: string;
  title: string;
  createdAt: string;
};

export type AdminCommentProjectSummary = {
  id: string | null;
  name: string;
  firstCommentDate: string;
  count: number;
  flaggedCount: number;
  positiveCount: number;
  negativeCount: number;
  latestCommentDate: string;
};

export type AdminCommentSelectedProject = {
  id: string | null;
  name: string;
};

export type AdminCommentsInsight = {
  total: number;
  flagged: number;
  positiveRate: number;
  toxicityRate: number;
};

export type AdminCommentApiItem = {
  id: string;
  text: string;
  sentimentScore?: number;
  user?: { email?: string; role?: string };
  createdAt: string;
  project?: { title?: string };
  news?: { title?: string };
  projectId?: string | null;
  sentimentLabel?: string;
  userId: string;
};

export type AdminCommentProjectApiItem = {
  id: string;
  title?: string;
  name?: string;
  createdAt: string;
};
