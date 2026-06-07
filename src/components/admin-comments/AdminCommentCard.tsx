import { Badge, cn } from "@/components/ui/primitives";
import {
  formatAdminCommentDate,
  formatAdminCommentTime,
  getAdminCommentRoleClass,
  getAdminCommentSentimentClass,
  getAdminCommentSentimentReason,
} from "@/lib/admin-comments/admin-comments-format";
import type { AdminCommentItem } from "@/lib/admin-comments/admin-comments-types";
import { Calendar, Clock, ShieldAlert, Sparkles, Trash2 } from "lucide-react";

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

        <AdminCommentAiInsight sentiment={comment.sentiment} />

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

function AdminCommentAiInsight({
  sentiment,
}: {
  sentiment: AdminCommentItem["sentiment"];
}) {
  return (
    <div className="relative mt-4 overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-blue-500/5" />
      <div className="relative rounded-xl border border-purple-100 bg-white/50 p-4 backdrop-blur-sm dark:border-purple-900/30 dark:bg-[#111827]/50">
        <div className="mb-3 flex items-center justify-between border-b border-purple-100/50 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse bg-purple-400 opacity-20 blur-sm" />
              <div className="relative rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 p-1.5 text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base text-[10px] font-black leading-none tracking-tight text-slate-900 dark:text-white">
                  AI Insight
                </h3>
                <span className="rounded-full border border-purple-200/50 bg-purple-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Beta
                </span>
              </div>
              <span className="mt-1.5 block text-[9px] font-black uppercase leading-none tracking-[0.15em] text-purple-600 dark:text-purple-400">
                Livon Intelligent Moderation AI
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-medium leading-relaxed text-slate-700 dark:text-white">
          <span className="font-bold text-purple-600">Alasan:</span>{" "}
          {getAdminCommentSentimentReason(sentiment)}
        </p>
      </div>
    </div>
  );
}
