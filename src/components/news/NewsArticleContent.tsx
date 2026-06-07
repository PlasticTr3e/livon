import { Clock, Tag, User } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import type { NewsArticleContent as NewsArticleContentType } from "@/lib/news/news-types";

type NewsArticleContentProps = {
  articleContent: NewsArticleContentType;
  author: string;
  date: string;
  tags: string[];
  thumbnailUrl?: string | null;
  title: string;
};

export function NewsArticleContent({
  articleContent,
  author,
  date,
  tags,
  thumbnailUrl,
  title,
}: NewsArticleContentProps) {
  return (
    <article className="min-w-0 flex-1">
      <h1 className="mb-4 text-2xl font-bold leading-tight text-gray-900 dark:text-white md:text-3xl">
        {title}
      </h1>

      <div className="mb-6 flex items-center gap-4 border-b border-gray-200 pb-6 text-xs text-gray-500 dark:border-gray-800 dark:text-white">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          <span>{author}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {date}
        </span>
      </div>

      <div className="mb-8 h-72 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 md:h-96">
        <ImageWithFallback
          src={thumbnailUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>

      {articleContent.excerpt && (
        <p className="mb-8 border-l-4 border-green-600 pl-5 text-lg font-medium italic leading-relaxed text-gray-600 dark:border-green-500 dark:text-white">
          {articleContent.excerpt}
        </p>
      )}

      <div className="space-y-5">
        {articleContent.body.length > 0 ? (
          articleContent.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-base leading-relaxed text-gray-700 dark:text-white"
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="italic text-gray-400">Tidak ada konten tambahan.</p>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-6 dark:border-gray-800">
          <Tag className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-white" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="cursor-pointer rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white dark:hover:bg-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
