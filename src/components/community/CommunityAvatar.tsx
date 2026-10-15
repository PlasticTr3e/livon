import { cn } from "@/components/ui/primitives";
import { getUserAvatarClassName, getUserInitial } from "@/lib/app-shell/user";
import type { CommunityAuthor } from "@/lib/community/community-types";

type CommunityAvatarSize = "xs" | "sm" | "md";

type CommunityAvatarProps = {
  author: CommunityAuthor;
  className?: string;
  size?: CommunityAvatarSize;
};

const avatarSizes: Record<CommunityAvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
};

export function CommunityAvatar({
  author,
  className,
  size = "md",
}: CommunityAvatarProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-bold shadow-sm",
        avatarSizes[size],
        getUserAvatarClassName(author.role),
        className,
      )}
    >
      {getUserInitial(author.name)}
    </div>
  );
}
