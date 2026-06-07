import type {
  NewsArticle,
  NewsArticleContent,
  NewsAuthor,
  NewsSortOption,
  NewsTag,
} from "./news-types";

export function normalizeNewsQuery(query?: string) {
  return query?.trim() || "";
}

export function normalizeNewsSort(sort?: string): NewsSortOption {
  return sort === "oldest" ? "oldest" : "latest";
}

export function formatNewsDate(date?: string | Date | null) {
  if (!date) return "";

  const newsDate = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(newsDate.getTime())
    ? ""
    : newsDate.toLocaleDateString("id-ID");
}

export function getNewsAuthorName(article: NewsArticle) {
  if (article.author) {
    return getAuthorName(article.author);
  }

  return article.createdById || "Admin";
}

export function getNewsTags(tags?: NewsTag[]) {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === "string") return tag;
      if (tag && typeof tag === "object" && "name" in tag) return tag.name;
      return "";
    })
    .filter(Boolean);
}

export function getNewsArticleContent(
  content?: string | null,
): NewsArticleContent {
  const paragraphs = (content || "")
    .split(/\n\s*\n/)
    .filter((paragraph) => paragraph.trim().length > 0);

  if (paragraphs.length > 1) {
    return {
      excerpt: paragraphs[0],
      body: paragraphs.slice(1),
    };
  }

  if (paragraphs.length === 1) {
    const [paragraph] = paragraphs;

    return {
      excerpt: `${paragraph.slice(0, 150)}${paragraph.length > 150 ? "..." : ""}`,
      body: paragraphs,
    };
  }

  return {
    excerpt: "",
    body: [],
  };
}

function getAuthorName(author: NewsAuthor) {
  return author.agencyProfile?.agencyName || author.name || "Administrator";
}
