import { Heart, MessageCircle } from "lucide-react";
import { getCommunityCommentCount } from "@/lib/community/community-feed";
import type { CommunityPost } from "@/lib/community/community-types";
import { CommunityActionButton } from "./CommunityActionButton";
import { CommunityDeleteButton } from "./CommunityDeleteButton";

type CommunityPostActionsProps = {
  post: CommunityPost;
  onComment: () => void;
  onDelete?: () => void;
  onToggleLike: () => void;
};

export function CommunityPostActions({
  post,
  onComment,
  onDelete,
  onToggleLike,
}: CommunityPostActionsProps) {
  return (
    <div className="-mx-1.5 mt-3 flex items-center gap-1 border-t border-gray-100 pt-2 dark:border-gray-800">
      <CommunityActionButton
        icon={Heart}
        tone="like"
        label={post.isLiked ? "Batal menyukai postingan" : "Sukai postingan"}
        count={post.likeCount}
        isActive={post.isLiked}
        onClick={onToggleLike}
      />
      <CommunityActionButton
        icon={MessageCircle}
        label="Komentari postingan"
        count={getCommunityCommentCount(post)}
        onClick={onComment}
      />
      {onDelete && (
        <div className="ml-auto">
          <CommunityDeleteButton label="Hapus postingan" onConfirm={onDelete} />
        </div>
      )}
    </div>
  );
}
