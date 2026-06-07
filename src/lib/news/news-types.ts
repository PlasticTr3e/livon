export type NewsSortOption = "latest" | "oldest";

export type NewsPageSearchParams = {
  q?: string;
  sort?: string;
};

export type NewsListItem = {
  id: string;
  title: string;
  content?: string | null;
  thumbnailUrl?: string | null;
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
};

export type NewsAgencyProfile = {
  agencyName: string;
};

export type NewsAuthor = {
  name?: string | null;
  agencyProfile?: NewsAgencyProfile | null;
};

export type NewsTag = { name: string } | string;

export type NewsCategory = { name: string } | null;

export type NewsArticle = NewsListItem & {
  createdById?: string | null;
  author?: NewsAuthor | null;
  tags?: NewsTag[];
  category?: NewsCategory;
};

export type NewsArticleContent = {
  body: string[];
  excerpt: string;
};
