"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import styles from "./community.module.css";

type CommunityActionButtonProps = {
  icon: LucideIcon;
  label: string;
  count?: number;
  isActive?: boolean;
  size?: "sm" | "md";
  text?: string;
  tone?: "like" | "neutral";
  onClick: () => void;
};

export function CommunityActionButton({
  icon: Icon,
  label,
  count,
  isActive = false,
  size = "md",
  text,
  tone = "neutral",
  onClick,
}: CommunityActionButtonProps) {
  // Only animate likes the user just made, not ones that were already active.
  const [hasToggled, setHasToggled] = useState(false);
  const isLike = tone === "like";
  const isLiked = isLike && isActive;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isLike ? isActive : undefined}
      onClick={() => {
        setHasToggled(true);
        onClick();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold tabular-nums transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 active:scale-95",
        size === "md" ? "h-10 px-3 text-sm" : "h-8 px-2.5 text-xs",
        isLiked
          ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10"
          : "text-gray-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-slate-800",
        isLike
          ? "hover:text-rose-500"
          : "hover:text-green-700 dark:hover:text-green-400",
      )}
    >
      <Icon
        className={cn(
          size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4",
          isLiked && "fill-rose-500",
          isLiked && hasToggled && styles.pop,
        )}
      />
      {count !== undefined && <span>{count}</span>}
      {text && <span>{text}</span>}
    </button>
  );
}
