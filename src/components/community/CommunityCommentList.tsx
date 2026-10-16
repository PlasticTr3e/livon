import type {
  CommunityComment,
  CommunityCommentTarget,
} from "@/lib/community/community-types";
import { CommunityCommentItem } from "./CommunityCommentItem";
import styles from "./community.module.css";

type CommunityCommentListProps = {
  canModerate: boolean;
  comments: CommunityComment[];
  onDelete: (target: CommunityCommentTarget) => void;
  onReply: (comment: CommunityComment) => void;
  onToggleLike: (target: CommunityCommentTarget) => void;
};

export function CommunityCommentList({
  canModerate,
  comments,
  onDelete,
  onReply,
  onToggleLike,
}: CommunityCommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-400">
        Belum ada komentar. Jadilah yang pertama!
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {comments.map((comment) => (
        <li key={comment.id} className={`px-4 py-4 ${styles.enter}`}>
          <CommunityCommentItem
            canModerate={canModerate}
            comment={comment}
            onDelete={onDelete}
            onReply={onReply}
            onToggleLike={onToggleLike}
          />
        </li>
      ))}
    </ul>
  );
}
