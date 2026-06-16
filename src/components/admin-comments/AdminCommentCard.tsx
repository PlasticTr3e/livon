import { Badge, cn } from "@/components/ui/primitives";
import {
  formatAdminCommentDate,
  formatAdminCommentTime,
  getAdminCommentRoleClass,
  getAdminCommentSentimentClass,
} from "@/lib/admin-comments/admin-comments-format";
import type { AdminCommentItem } from "@/lib/admin-comments/admin-comments-types";
import { Calendar, Clock, ShieldAlert, Trash2 } from "lucide-react";

type AdminCommentCardProps = {
  comment: AdminCommentItem;
  onDelete: (commentId: string) => void;
};

export function AdminCommentCard({ comment, onDelete }: AdminCommentCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:bg-green-50 dark:bg-[#1F2937] dark:hover:bg-slate-700",
        comment.flag
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
          : "border-gray-100 dark:border-gray-800",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          getAdminCommentRoleClass(comment.role),
        )}
      >
        {comment.author.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {comment.author}
          </span>
          <AdminCommentBadges comment={comment} />
        </div>

        <p className="text-sm leading-relaxed text-gray-700 dark:text-white">
          {comment.text}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="flex items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
              <Calendar className="h-3 w-3" />
              {formatAdminCommentDate(comment.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3 text-[10px] font-medium text-gray-400">
              <Clock className="h-3 w-3" />
              {formatAdminCommentTime(comment.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCommentBadges({ comment }: { comment: AdminCommentItem }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {comment.flag && (
        <Badge className="flex items-center gap-0.5 border-red-300 bg-red-100 text-[10px] text-red-600">
          <ShieldAlert className="h-3 w-3" /> Ditandai
        </Badge>
      )}
      <Badge
        className={cn(
          "text-[10px]",
          getAdminCommentSentimentClass(comment.sentiment),
        )}
      >
        {comment.sentiment}
      </Badge>
    </div>
  );
}
