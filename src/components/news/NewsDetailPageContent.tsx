import {
  formatNewsDate,
  getNewsArticleContent,
  getNewsAuthorName,
  getNewsTags,
} from "@/lib/news/news-format";
import type { NewsArticle, NewsListItem } from "@/lib/news/news-types";
import { NewsArticleContent } from "./NewsArticleContent";
import { NewsArticleSidebar } from "./NewsArticleSidebar";
import { NewsBackBar } from "./NewsBackBar";

type NewsDetailPageContentProps = {
  article: NewsArticle;
  relatedNews: NewsListItem[];
};

export function NewsDetailPageContent({
  article,
  relatedNews,
}: NewsDetailPageContentProps) {
  const author = getNewsAuthorName(article);
  const articleContent = getNewsArticleContent(article.content);
  const date = formatNewsDate(article.publishedAt);
  const tags = getNewsTags(article.tags);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      <NewsBackBar />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        <div className="flex flex-col gap-10 lg:flex-row">
          <NewsArticleContent
            articleContent={articleContent}
            author={author}
            date={date}
            tags={tags}
            thumbnailUrl={article.thumbnailUrl}
            title={article.title}
          />
          <NewsArticleSidebar
            author={author}
            date={date}
            relatedNews={relatedNews}
          />
        </div>
      </div>
    </div>
  );
}
