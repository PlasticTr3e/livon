import { memo } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  Coins,
  MapPin,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Users,
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
import type { MapProject, MapVoteChoice } from "@/lib/map/map-types";

const MAP_CATEGORY_BADGE_CLASS =
  "border border-green-300 bg-green-100 text-green-700 dark:border-green-400/40 dark:bg-green-500/20 dark:text-green-200";

type MapProjectDetailPanelProps = {
  project: MapProject;
  currentVote?: MapVoteChoice;
  isSavingVote?: boolean;
  userRole: string;
  onClose: () => void;
  onDonate: (projectId: string) => void;
  onSeeComments: (projectId: string) => void;
  onViewDetail: (projectId: string) => void;
  onVote: (projectId: string, voteType: MapVoteChoice) => void;
};

export const MapProjectDetailPanel = memo(function MapProjectDetailPanel({
  project,
  currentVote,
  isSavingVote,
  userRole,
  onClose,
  onDonate,
  onSeeComments,
  onViewDetail,
  onVote,
}: MapProjectDetailPanelProps) {
  return (
    <div className="absolute left-4 right-4 top-4 z-[1000] flex max-h-[calc(100dvh-10rem)] w-auto max-w-[280px] flex-col rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-[#111827]/95 md:left-auto md:right-4 md:w-full">
      <MapProjectDetailImage project={project} onClose={onClose} />
      <MapProjectDetailHeader project={project} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        <MapProjectCoreStats project={project} />
        <MapProjectFundingProgress project={project} />

        {userRole === "resident" && (
          <MapResidentActions
            project={project}
            currentVote={currentVote}
            isSavingVote={isSavingVote}
            onDonate={onDonate}
            onVote={onVote}
          />
        )}

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
          <Activity className="h-2.5 w-2.5" /> Progress
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

function MapProjectFundingProgress({ project }: { project: MapProject }) {
  if (!["Funding", "Construction", "Completed"].includes(project.status)) {
    return null;
  }

  const fundingPercentage =
    project.budget > 0 ? (project.fundsCollected / project.budget) * 100 : 0;

  return (
    <div className="flex flex-col rounded-lg border border-green-100 bg-green-50 p-2 dark:border-green-900/50 dark:bg-green-900/10">
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
          <Coins className="h-2.5 w-2.5" /> Funds Collected
        </span>
        <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
          {fundingPercentage.toFixed(0)}%
        </span>
      </div>
      <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-green-200/50 dark:bg-green-800/50">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${Math.min(100, fundingPercentage)}%` }}
        />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[11px] font-bold leading-none text-green-700 dark:text-green-400">
          {formatRupiahFull(project.fundsCollected)}
        </span>
        <span className="text-[9px] font-medium leading-none text-green-600/70">
          / {formatRupiahFull(project.budget)}
        </span>
      </div>
    </div>
  );
}

function MapResidentActions({
  project,
  currentVote,
  isSavingVote,
  onDonate,
  onVote,
}: {
  project: MapProject;
  currentVote?: MapVoteChoice;
  isSavingVote?: boolean;
  onDonate: (projectId: string) => void;
  onVote: (projectId: string, voteType: MapVoteChoice) => void;
}) {
  const canVote = project.status === "Planning";

  return (
    <div className="space-y-2.5">
      {canVote && (
        <div>
          <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Feedback
          </span>
          <div className="flex gap-2">
            <MapVoteButton
              count={project.votes.agree}
              isActive={currentVote === "agree"}
              isSaving={isSavingVote}
              type="agree"
              onClick={() => onVote(project.id, "agree")}
            />
            <MapVoteButton
              count={project.votes.disagree}
              isActive={currentVote === "disagree"}
              isSaving={isSavingVote}
              type="disagree"
              onClick={() => onVote(project.id, "disagree")}
            />
          </div>
        </div>
      )}

      {project.status === "Funding" && (
        <button
          type="button"
          onClick={() => onDonate(project.id)}
          className="w-full rounded-lg bg-gray-900 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-gray-800 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
        >
          Fund this project
        </button>
      )}
    </div>
  );
}

function MapVoteButton({
  count,
  isActive,
  isSaving,
  type,
  onClick,
}: {
  count: number;
  isActive: boolean;
  isSaving?: boolean;
  type: MapVoteChoice;
  onClick: () => void;
}) {
  const Icon = type === "agree" ? ThumbsUp : ThumbsDown;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        isActive && type === "agree"
          ? "border-green-600 bg-green-600 text-white shadow-sm shadow-green-500/20"
          : isActive
            ? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-500/20"
            : "border-gray-200 bg-white text-gray-600 hover:text-green-600 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white",
      )}
    >
      <Icon className="h-3 w-3" /> {count}
    </button>
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
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-gray-800 dark:bg-[#1F2937]/50">
          <p className="mb-0.5 flex items-center text-[9px] font-semibold uppercase text-gray-400">
            <Users className="mr-1 h-2.5 w-2.5" /> Votes
          </p>
          <p className="text-xs font-bold text-gray-900 dark:text-white">
            {project.votes.agree + project.votes.disagree}
          </p>
        </div>
        {["Construction", "Completed"].includes(project.status) && (
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
