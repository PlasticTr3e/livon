import { cn } from "@/components/ui/primitives";
import type { CommunityPost } from "@/lib/community/community-types";
import { CommunityAvatar } from "./CommunityAvatar";
import { CommunityImageGrid } from "./CommunityImageGrid";
import { CommunityRoleBadge } from "./CommunityRoleBadge";

type CommunityPostContentProps = {
  post: CommunityPost;
  isClamped?: boolean;
  onOpen?: () => void;
  onOpenImage: (index: number) => void;
};

const textClassName =
  "block whitespace-pre-line break-words text-[15px] leading-relaxed text-gray-700 dark:text-gray-200";

export function CommunityPostContent({
  post,
  isClamped = false,
  onOpen,
  onOpenImage,
}: CommunityPostContentProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <CommunityAvatar author={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold leading-tight text-gray-900 dark:text-white">
              {post.author.name}
            </p>
            <CommunityRoleBadge role={post.author.role} />
          </div>
          <p className="mt-0.5 text-xs text-gray-400">{post.timeLabel}</p>
        </div>
      </div>

      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <span className={cn(textClassName, isClamped && "line-clamp-6")}>
            {post.content}
          </span>
        </button>
      ) : (
        <p className={cn(textClassName, "mt-3")}>{post.content}</p>
      )}

      {post.images.length > 0 && (
        <div className="mt-3">
          <CommunityImageGrid
            images={post.images}
            title={`Foto dari ${post.author.name}`}
            onOpenImage={onOpenImage}
          />
        </div>
      )}
    </>
  );
}
