import Link from "next/link";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatNewsDate } from "@/lib/news/news-format";
import type { NewsListItem } from "@/lib/news/news-types";

type NewsArticleSidebarProps = {
  author: string;
  date: string;
  relatedNews: NewsListItem[];
};

export function NewsArticleSidebar({
  author,
  date,
  relatedNews,
}: NewsArticleSidebarProps) {
  return (
    <aside className="w-full flex-shrink-0 lg:w-72">
      <div className="space-y-6 lg:sticky lg:top-0">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1F2937]">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white">
            About this news
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="mb-0.5 text-xs uppercase tracking-wider text-gray-400 dark:text-white">
                Author
              </dt>
              <dd className="font-semibold text-gray-800 dark:text-white">
                {author}
              </dd>
            </div>
            <div>
              <dt className="mb-0.5 text-xs uppercase tracking-wider text-gray-400 dark:text-white">
                Published
              </dt>
              <dd className="font-semibold text-gray-800 dark:text-white">
                {date}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-[#1F2937]">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white">
            Related News
          </p>
          <div className="space-y-4">
            {relatedNews.map((related) => (
              <Link
                key={related.id}
                href={`/news/${related.id}`}
                className="group flex gap-3"
              >
                <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                  <ImageWithFallback
                    src={related.thumbnailUrl}
                    alt={related.title}
                    className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold leading-snug text-gray-800 transition-colors group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
                    {related.title}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-white">
                    {formatNewsDate(related.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
