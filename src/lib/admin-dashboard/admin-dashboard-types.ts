export type AdminDashboardSortMode = "viral" | "sentiment";

export type SentimentDistribution = {
  positive: number;
  negative: number;
  neutral: number;
};

export type SentimentAnalytics = {
  distribution?: SentimentDistribution;
  averageScore?: number;
};

export type AdminDashboardProject = {
  id: string;
  title: string;
  status?: string;
  totalVotes?: number;
  currentFunding?: number | string;
  sentimentAnalytics?: SentimentAnalytics;
};

export type AdminDashboardMetrics = {
  totalWargaAktif: number;
  totalProyek: number;
  totalPartisipasi: number;
  totalDana: number;
};

export type ProjectStatusChartItem = {
  name: string;
  value: number;
};

export type ProjectSentimentChartItem = {
  name: string;
  fullName: string;
  Positive: number;
  Neutral: number;
  Negative: number;
};

export type DominantSentiment = {
  label: "Positive" | "Negative" | "Neutral" | "None";
  color: string;
  percentage: number;
};
