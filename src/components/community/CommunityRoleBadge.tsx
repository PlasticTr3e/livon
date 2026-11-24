"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Badge, cn } from "@/components/ui/primitives";
import { getUserRoleLabel } from "@/lib/app-shell/user";
import type { CommunityAuthor } from "@/lib/community/community-types";

type CommunityRoleBadgeProps = {
  role: CommunityAuthor["role"];
};

export function CommunityRoleBadge({ role }: CommunityRoleBadgeProps) {
  const { t: translateUi } = useLanguage();

  if (role !== "agency" && role !== "developer") return null;

  return (
    <Badge
      className={cn(
        "shrink-0 px-2 py-px text-[10px] font-bold uppercase tracking-wider",
        role === "developer"
          ? "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      )}
    >
      {translateUi(getUserRoleLabel(role))}
    </Badge>
  );
}
