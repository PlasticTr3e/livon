import { Edit2, Image as ImageIcon, Star, Trash2 } from "lucide-react";
import { Badge, Card, cn } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { LoadingState } from "@/components/shared/LoadingState";
import type { AdminNewsWithExtras } from "@/lib/admin-news/admin-news-types";

type AdminNewsTableProps = {
  error: string | null;
  isLoading: boolean;
  news: AdminNewsWithExtras[];
  onDelete: (id: string) => void;
  onEdit: (item: AdminNewsWithExtras) => void;
  onToggleHeadline: (id: string) => void;
};

export function AdminNewsTable({
  error,
  isLoading,
  news,
  onDelete,
  onEdit,
  onToggleHeadline,
}: AdminNewsTableProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      {isLoading ? (
        <LoadingState
          label="Loading news..."
          variant="panel"
          className="bg-transparent"
        />
      ) : error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
                <th className="px-8 py-4">News Details</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4">Publication Date</th>
                <th className="px-4 py-4">Author</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {news.map((item) => (
                <AdminNewsTableRow
                  key={item.id}
                  item={item}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onToggleHeadline={onToggleHeadline}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function AdminNewsTableRow({
  item,
  onDelete,
  onEdit,
  onToggleHeadline,
}: {
  item: AdminNewsWithExtras;
  onDelete: (id: string) => void;
  onEdit: (item: AdminNewsWithExtras) => void;
  onToggleHeadline: (id: string) => void;
}) {
  return (
    <tr
      className={cn(
        "group transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20",
        item.isHeadline && "bg-yellow-50/40 dark:bg-yellow-900/10",
      )}
    >
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          {item.thumbnailUrl ? (
            <ImageWithFallback
              src={item.thumbnailUrl}
              alt={item.title}
              width={40}
              height={40}
              className="h-12 w-12 flex-shrink-0 rounded-xl border border-gray-200 object-cover dark:border-gray-800"
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-[#1F2937]">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <span className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
              {item.title}
            </span>
            {item.isHeadline && (
              <span className="mt-1 inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Headline
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <Badge
            className={cn(
              "rounded-full px-4 py-1 text-[10px] font-semibold",
              item.publishedAt
                ? "border-green-300 bg-green-100 text-green-700"
                : "border-gray-300 bg-gray-100 text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white",
            )}
          >
            {item.publishedAt ? "Published" : "Draft"}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-6 text-xs font-semibold text-gray-500 dark:text-white">
        {item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString()
          : "-"}
      </td>
      <td className="px-4 py-6 text-xs font-semibold text-gray-700 dark:text-white">
        {item.author?.agencyProfile?.agencyName || item.createdById}
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className={cn(
              "rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm transition-all hover:bg-yellow-400 hover:text-white dark:border-gray-800 dark:bg-[#1F2937]",
              item.isHeadline
                ? "text-yellow-500 dark:text-yellow-300"
                : "text-gray-400 dark:text-gray-500",
            )}
            onClick={() => onToggleHeadline(item.id)}
            title={item.isHeadline ? "Current headline" : "Set as headline"}
          >
            <Star
              className={cn("h-4 w-4", item.isHeadline && "fill-current")}
            />
          </button>
          <button
            type="button"
            className="rounded-xl border border-gray-100 bg-white p-2.5 text-green-600 shadow-sm transition-all hover:bg-green-600 hover:text-white dark:border-gray-800 dark:bg-[#1F2937] dark:text-green-400 dark:hover:bg-green-700"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-xl border border-gray-100 bg-white p-2.5 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white dark:border-gray-800 dark:bg-[#1F2937] dark:text-red-400 dark:hover:bg-red-600"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
