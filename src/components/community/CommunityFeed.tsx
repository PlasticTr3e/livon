import { MessagesSquare, SearchX } from "lucide-react";
import type { CommunityPost } from "@/lib/community/community-types";
import { CommunityPostCard } from "./CommunityPostCard";

type CommunityFeedProps = {
  canModerate: boolean;
  isSearching: boolean;
  posts: CommunityPost[];
  onDeletePost: (postId: string) => void | Promise<unknown>;
  onOpenImage: (post: CommunityPost, index: number) => void;
  onOpenPost: (postId: string) => void;
  onToggleLike: (postId: string) => void | Promise<unknown>;
};

export function CommunityFeed({
  canModerate,
  isSearching,
  posts,
  onDeletePost,
  onOpenImage,
  onOpenPost,
  onToggleLike,
}: CommunityFeedProps) {
  if (posts.length === 0) {
    const EmptyIcon = isSearching ? SearchX : MessagesSquare;

    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center text-gray-400">
        <EmptyIcon className="h-12 w-12 opacity-20" />
        <p className="text-sm font-medium">
          {isSearching
            ? "No posts match your search."
            : "No posts yet. Be the first to share your ideas."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {posts.map((post) => (
        <CommunityPostCard
          key={post.id}
          post={post}
          onDelete={canModerate ? () => onDeletePost(post.id) : undefined}
          onOpen={() => onOpenPost(post.id)}
          onOpenImage={(index) => onOpenImage(post, index)}
          onToggleLike={() => onToggleLike(post.id)}
        />
      ))}
    </div>
  );
}
