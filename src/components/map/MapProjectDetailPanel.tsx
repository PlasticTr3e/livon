import { memo } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Wallet,
  X,
} from "lucide-react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn, Badge } from "@/components/ui/primitives";
import {
  formatRupiahFull,
  getMapProgressColorValue,
  getMapProjectDuration,
  getMapStatusStyle,
} from "@/lib/map/map-format";
import type { MapProject } from "@/lib/map/map-types";

const MAP_CATEGORY_BADGE_CLASS =
  "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

type MapProjectDetailPanelProps = {
  project: MapProject;
  userRole: string;
  onClose: () => void;
  onSeeComments: (projectId: string) => void;
  onViewDetail: (projectId: string) => void;
};

export const MapProjectDetailPanel = memo(function MapProjectDetailPanel({
  project,
  userRole,
  onClose,
  onSeeComments,
  onViewDetail,
}: MapProjectDetailPanelProps) {
  return (
    <div className="absolute left-4 right-4 top-4 z-[1000] flex max-h-[calc(100dvh-10rem)] w-auto max-w-[280px] flex-col rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-[#111827]/95 md:left-auto md:right-4 md:w-full">
      <MapProjectDetailImage project={project} onClose={onClose} />
      <MapProjectDetailHeader project={project} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        <MapProjectCoreStats project={project} />

        <MapProjectComments project={project} onSeeComments={onSeeComments} />

        {userRole === "agency" && <MapAgencyStats project={project} />}
      </div>

      <div className="p-3 pt-0">
        <button
          type="button"
          onClick={() => onViewDetail(project.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-white dark:hover:bg-slate-800"
        >
          <span>View Details</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

function MapProjectDetailImage({
  project,
  onClose,
}: {
  project: MapProject;
  onClose: () => void;
}) {
  return (
    <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-2xl bg-gray-200 dark:bg-[#1F2937]">
      <ImageWithFallback
        src={project.imageUrl}
        alt="Project thumbnail"
        fill
        sizes="280px"
        className="h-full w-full object-cover"
        fallbackSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

      <button
        type="button"
        className="absolute right-2 top-2 rounded-full bg-black/20 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/40"
        onClick={onClose}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MapProjectDetailHeader({ project }: { project: MapProject }) {
  return (
    <div className="flex items-start justify-between px-4 pb-2 pt-3">
      <div className="flex-1 pr-2">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              "px-1.5 py-0.5 text-[9px] shadow-sm",
              getMapStatusStyle(project.status),
            )}
          >
            {project.status}
          </Badge>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              MAP_CATEGORY_BADGE_CLASS,
            )}
          >
            {project.category}
          </span>
        </div>
        <h3 className="mb-0.5 text-sm font-bold leading-tight text-gray-900 dark:text-white">
          {project.name}
        </h3>
        <p className="flex items-center text-[10px] text-gray-500 dark:text-white">
          <MapPin className="mr-1 h-3 w-3 text-gray-400" />
          {project.address}
        </p>
      </div>
    </div>
  );
}

function MapProjectCoreStats({ project }: { project: MapProject }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1F2937]/50">
        <span className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          <Wallet className="h-2.5 w-2.5" /> Budget
        </span>
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          {formatRupiahFull(project.budget)}
        </span>
      </div>
      <div className="flex flex-col rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1F2937]/50">
        <span className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          <Activity className="h-2.5 w-2.5" /> Stage progress
        </span>
        <div className="mt-0.5 flex items-center gap-1.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full"
              style={{
                width: `${project.progress}%`,
                backgroundColor: getMapProgressColorValue(project.status),
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-900 dark:text-white">
            {project.progress}%
          </span>
        </div>
      </div>
    </div>
  );
}

function MapProjectComments({
  project,
  onSeeComments,
}: {
  project: MapProject;
  onSeeComments: (projectId: string) => void;
}) {
  const latestComment = project.comments[0];

  return (
    <div className="pt-1">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          <MessageSquare className="h-2.5 w-2.5" /> Latest Comments
        </span>
        <button
          type="button"
          onClick={() => onSeeComments(project.id)}
          className="flex items-center text-[9px] font-bold text-blue-600 hover:underline dark:text-blue-400"
        >
          See all <ChevronRight className="ml-0.5 h-2 w-2" />
        </button>
      </div>

      {latestComment ? (
        <div className="space-y-1.5">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1F2937]/50">
            <div className="mb-0.5 flex items-center justify-between">
              <p className="text-[9px] font-bold text-gray-800 dark:text-white">
                {latestComment.author}
              </p>
              <p className="text-[8px] text-gray-400">
                {latestComment.timestamp}
              </p>
            </div>
            <p className="line-clamp-1 text-[10px] leading-tight text-gray-600 dark:text-white">
              {latestComment.text}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-center dark:border-gray-800 dark:bg-[#1F2937]/50">
          <p className="text-[9px] italic text-gray-500">
            No comments yet. Be the first!
          </p>
        </div>
      )}
    </div>
  );
}

function MapAgencyStats({ project }: { project: MapProject }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {["Under Construction", "Completed"].includes(project.status) && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1F2937]/50">
            <p className="mb-0.5 flex items-center text-[9px] font-semibold uppercase text-gray-400">
              <Clock className="mr-1 h-2.5 w-2.5" /> Duration
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {getMapProjectDuration(project)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
