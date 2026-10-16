import { Heart, MessageCircle } from "lucide-react";
import type {
  CommunityComment,
  CommunityCommentTarget,
  CommunityReply,
} from "@/lib/community/community-types";
import { CommunityActionButton } from "./CommunityActionButton";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityDeleteButton } from "./CommunityDeleteButton";
import { CommunityRoleBadge } from "./CommunityRoleBadge";

type CommunityCommentItemProps = {
  canModerate: boolean;
  comment: CommunityComment;
  onDelete: (target: CommunityCommentTarget) => void;
  onReply: (comment: CommunityComment) => void;
  onToggleLike: (target: CommunityCommentTarget) => void;
};

export function CommunityCommentItem({
  canModerate,
  comment,
  onDelete,
  onReply,
  onToggleLike,
}: CommunityCommentItemProps) {
  const hasReplies = comment.replies.length > 0;

  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center">
        <CommunityAvatar author={comment.author} className="h-9 w-9 text-xs" />
        {hasReplies && (
          <div className="mt-1.5 w-px flex-1 bg-gray-200 dark:bg-gray-700" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <CommunityCommentEntry
          entry={comment}
          onDelete={
            canModerate ? () => onDelete({ commentId: comment.id }) : undefined
          }
          onReply={() => onReply(comment)}
          onToggleLike={() => onToggleLike({ commentId: comment.id })}
        />

        {comment.replies.map((reply) => {
          const target = { commentId: comment.id, replyId: reply.id };

          return (
            <div key={reply.id} className="mt-3 flex gap-2.5">
              <CommunityAvatar author={reply.author} size="sm" />
              <div className="min-w-0 flex-1">
                <CommunityCommentEntry
                  entry={reply}
                  onDelete={canModerate ? () => onDelete(target) : undefined}
                  onReply={() => onReply(comment)}
                  onToggleLike={() => onToggleLike(target)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommunityCommentEntry({
  entry,
  onDelete,
  onReply,
  onToggleLike,
}: {
  entry: CommunityReply;
  onDelete?: () => void;
  onReply: () => void;
  onToggleLike: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {entry.author.name}
        </span>
        <CommunityRoleBadge role={entry.author.role} />
        <span className="text-xs text-gray-400">· {entry.timeLabel}</span>
      </div>
      <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        {entry.content}
      </p>
      <div className="-ml-2.5 mt-1 flex items-center gap-0.5">
        <CommunityActionButton
          icon={Heart}
          tone="like"
          size="sm"
          label={entry.isLiked ? "Batal menyukai komentar" : "Sukai komentar"}
          count={entry.likeCount > 0 ? entry.likeCount : undefined}
          isActive={entry.isLiked}
          onClick={onToggleLike}
        />
        <CommunityActionButton
          icon={MessageCircle}
          size="sm"
          label={`Balas ${entry.author.name}`}
          text="Balas"
          onClick={onReply}
        />
        {onDelete && (
          <CommunityDeleteButton
            size="sm"
            label="Hapus komentar"
            onConfirm={onDelete}
          />
        )}
      </div>
    </>
  );
}
