import { ChevronRight, ThumbsUp } from "lucide-react";
import { cn, Badge, Button, Card } from "@/components/ui/primitives";
import { getMapProgressColor, getMapStatusStyle } from "@/lib/map/map-format";
import type { MapProject } from "@/lib/map/map-types";

type MapProjectCardProps = {
  isSelected: boolean;
  project: MapProject;
  onClick: () => void;
};

export function MapProjectCard({
  isSelected,
  project,
  onClick,
}: MapProjectCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer p-3 transition-all",
        isSelected
          ? "border-green-500 bg-green-50 ring-2 ring-green-200 dark:border-green-600 dark:bg-green-900/20 dark:ring-green-900"
          : "hover:border-green-300 hover:shadow-md dark:hover:border-green-700",
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="pr-2 text-sm font-semibold leading-tight text-gray-800 dark:text-white">
          {project.name}
        </h3>
        <Badge
          className={cn(
            "shrink-0 text-[10px]",
            getMapStatusStyle(project.status),
          )}
        >
          {project.status}
        </Badge>
      </div>

      <p className="mb-2 line-clamp-1 text-xs text-gray-400 dark:text-white">
        {project.address}
      </p>

      <div className="mb-2">
        <div className="mb-1 flex justify-between text-[10px] text-gray-500 dark:text-white">
          <span>Progress</span>
          <span className="font-semibold text-gray-700 dark:text-white">
            {project.progress}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              getMapProgressColor(project.status),
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-white">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-gray-700 dark:bg-slate-700 dark:text-white">
            {project.category}
          </span>
          <span className="flex items-center gap-0.5">
            <ThumbsUp className="h-3 w-3" /> {project.votes.agree}
          </span>
        </div>
        <Button
          variant="ghost"
          className="h-auto p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
