import { MapPin } from "lucide-react";

export function MapLoadingPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-100 via-slate-100 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 animate-pulse items-center justify-center rounded-full border border-white/50 bg-white/60 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-[#1F2937]/60">
          <MapPin className="h-10 w-10 text-green-500 dark:text-green-400" />
        </div>
        <p className="font-bold text-green-700 dark:text-green-400">
          Loading Map...
        </p>
      </div>
    </div>
  );
}
