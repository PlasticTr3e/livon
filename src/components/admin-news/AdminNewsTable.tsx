import { Edit2, Image as ImageIcon, Trash2 } from "lucide-react";
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
    <Card className="border-green-100 p-5 shadow-sm dark:border-gray-800">
      {isLoading ? (
        <LoadingState
          label="Memuat data berita..."
          variant="panel"
          className="bg-transparent"
        />
      ) : error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm md:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-white">
                <th className="px-4 py-3">News Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Publication Date</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Headline</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
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
        "transition-colors hover:bg-green-50 dark:hover:bg-green-900/10",
        item.isHeadline && "ring-2 ring-green-400",
      )}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {item.thumbnailUrl ? (
            <ImageWithFallback
              src={item.thumbnailUrl}
              alt={item.title}
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 rounded border border-gray-200 object-cover dark:border-gray-800"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-[#1F2937]">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <span className="line-clamp-2 font-semibold text-gray-900 dark:text-white">
            {item.title}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge
          className={cn(
            "text-xs",
            item.publishedAt
              ? "border-green-300 bg-green-100 text-green-700"
              : "border-gray-300 bg-gray-100 text-gray-600 dark:border-slate-600 dark:bg-slate-700 dark:text-white",
          )}
        >
          {item.publishedAt ? "Published" : "Draft"}
        </Badge>
      </td>
      <td className="px-4 py-4 text-xs text-gray-500 dark:text-white">
        {item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString()
          : "-"}
      </td>
      <td className="px-4 py-4 text-xs text-gray-700 dark:text-white">
        {item.author?.agencyProfile?.agencyName || item.createdById}
      </td>
      <td className="px-4 py-4 text-center">
        <input
          type="radio"
          name="headline-news"
          checked={!!item.isHeadline}
          onChange={() => onToggleHeadline(item.id)}
          aria-label="Set as headline"
        />
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
