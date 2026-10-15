import { MessagesSquare } from "lucide-react";
import type { CommunityPageVariant } from "@/lib/community/community-types";

type CommunityHeaderProps = {
  variant: CommunityPageVariant;
};

export function CommunityHeader({ variant }: CommunityHeaderProps) {
  if (variant === "admin") {
    return (
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Komunitas
        </h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-white">
          Pantau aspirasi warga, tanggapi, dan moderasi diskusi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-md">
        <MessagesSquare className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-black leading-tight text-gray-900 dark:text-white sm:text-3xl">
          Komunitas
        </h1>
        <p className="text-sm leading-relaxed text-gray-500 dark:text-white">
          Sampaikan aspirasi dan ikuti kabar dari lingkungan Anda.
        </p>
      </div>
    </div>
  );
}
