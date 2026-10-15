"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/components/ui/primitives";

type CommunityDeleteButtonProps = {
  label: string;
  size?: "sm" | "md";
  onConfirm: () => void;
};

const CONFIRM_RESET_MS = 3000;

export function CommunityDeleteButton({
  label,
  size = "md",
  onConfirm,
}: CommunityDeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isConfirming) return;

    const timeout = window.setTimeout(
      () => setIsConfirming(false),
      CONFIRM_RESET_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [isConfirming]);

  return (
    <button
      type="button"
      aria-label={isConfirming ? `Konfirmasi ${label.toLowerCase()}` : label}
      title={label}
      onClick={() => (isConfirming ? onConfirm() : setIsConfirming(true))}
      onBlur={() => setIsConfirming(false)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 active:scale-95",
        size === "md" ? "h-10 px-3 text-sm" : "h-8 px-2.5 text-xs",
        isConfirming
          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          : "text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400",
      )}
    >
      <Trash2 className={size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4"} />
      {isConfirming && <span>Yakin hapus?</span>}
    </button>
  );
}
