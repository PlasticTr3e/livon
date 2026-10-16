import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";

type CommunityToolbarProps = {
  searchQuery: string;
  onCreate: () => void;
  onSearchChange: (query: string) => void;
};

export function CommunityToolbar({
  searchQuery,
  onCreate,
  onSearchChange,
}: CommunityToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Cari postingan atau pengguna"
          placeholder="Cari postingan atau pengguna..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-base text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-800 dark:bg-[#111827] dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {searchQuery && (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => onSearchChange("")}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Button
        variant="primary"
        onClick={onCreate}
        className="hidden h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-bold sm:flex"
      >
        <Plus className="h-4 w-4" />
        <span>Buat aspirasi</span>
      </Button>
    </div>
  );
}
