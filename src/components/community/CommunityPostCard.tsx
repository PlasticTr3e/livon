import { Card } from "@/components/ui/primitives";
import type { CommunityPost } from "@/lib/community/community-types";
import { CommunityPostActions } from "./CommunityPostActions";
import { CommunityPostContent } from "./CommunityPostContent";

type CommunityPostCardProps = {
  post: CommunityPost;
  onDelete?: () => void;
  onOpen: () => void;
  onOpenImage: (index: number) => void;
  onToggleLike: () => void;
};

export function CommunityPostCard({
  post,
  onDelete,
  onOpen,
  onOpenImage,
  onToggleLike,
}: CommunityPostCardProps) {
  return (
    <Card className="rounded-2xl p-4 pb-2 transition-shadow duration-200 hover:shadow-md dark:border-gray-800 dark:bg-[#1F2937]">
      <CommunityPostContent
        post={post}
        isClamped
        onOpen={onOpen}
        onOpenImage={onOpenImage}
      />
      <CommunityPostActions
        post={post}
        onComment={onOpen}
        onDelete={onDelete}
        onToggleLike={onToggleLike}
      />
    </Card>
  );
}
