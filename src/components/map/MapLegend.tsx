import { Layers } from "lucide-react";
import { cn } from "@/components/ui/primitives";
import { getMapStatusStyle, MAP_LEGEND_ITEMS } from "@/lib/map/map-format";

export function MapLegend() {
  return (
    <div className="absolute left-4 top-4 z-[900] flex flex-col gap-2">
      <div className="rounded-2xl border border-gray-100 bg-white/90 p-3 shadow-lg backdrop-blur-md dark:border-gray-800 dark:bg-[#111827]/90">
        <div className="mb-2 flex items-center gap-2 px-1">
          <Layers className="h-4 w-4 text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Legend
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {MAP_LEGEND_ITEMS.map(({ status, label }) => (
            <div
              key={status}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                getMapStatusStyle(status),
              )}
            >
              <div className="h-2 w-2 rounded-full bg-current opacity-70" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
