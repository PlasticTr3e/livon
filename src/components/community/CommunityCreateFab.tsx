import { PenLine } from "lucide-react";

type CommunityCreateFabProps = {
  onClick: () => void;
};

export function CommunityCreateFab({ onClick }: CommunityCreateFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buat aspirasi baru"
      className="absolute bottom-4 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-600/30 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-95 dark:shadow-black/40 sm:hidden"
    >
      <PenLine className="h-6 w-6" />
    </button>
  );
}
