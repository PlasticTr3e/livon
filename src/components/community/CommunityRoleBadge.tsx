import { Badge } from "@/components/ui/primitives";
import { getUserRoleLabel } from "@/lib/app-shell/user";
import type { CommunityAuthor } from "@/lib/community/community-types";

type CommunityRoleBadgeProps = {
  role: CommunityAuthor["role"];
};

export function CommunityRoleBadge({ role }: CommunityRoleBadgeProps) {
  if (role !== "agency") return null;

  return (
    <Badge className="shrink-0 border-blue-200 bg-blue-50 px-2 py-px text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      {getUserRoleLabel(role)}
    </Badge>
  );
}
