import type {
  MapProject,
  MapProjectStatus,
  MapStatusFilter,
  MapVoteAction,
  MapVoteChoice,
  VoteDelta,
} from "./map-types";

export const MAP_STATUS_FILTERS: MapStatusFilter[] = [
  "All",
  "Planning",
  "Funding",
  "Construction",
  "Completed",
];

export const MAP_LEGEND_ITEMS: { status: MapProjectStatus; label: string }[] = [
  { status: "Planning", label: "Planning" },
  { status: "Funding", label: "Funding" },
  { status: "Construction", label: "Construction" },
  { status: "Completed", label: "Completed" },
];

export function mapStatusToUI(status: string): MapProjectStatus {
  switch (status) {
    case "DISETUJUI":
      return "Funding";
    case "BERJALAN":
      return "Construction";
    case "SELESAI":
      return "Completed";
    case "USULAN":
    default:
      return "Planning";
  }
}

export function getMapStatusStyle(status: string) {
  switch (status) {
    case "Planning":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    case "Funding":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700";
    case "Construction":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    case "Completed":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
    default:
      return "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-white";
  }
}

export function getMapProgressColor(status: string) {
  switch (status) {
    case "Planning":
      return "bg-gradient-to-r from-blue-400 to-blue-600";
    case "Funding":
      return "bg-gradient-to-r from-yellow-400 to-amber-500";
    case "Construction":
      return "bg-gradient-to-r from-orange-400 to-orange-600";
    case "Completed":
      return "bg-gradient-to-r from-green-400 to-green-600";
    default:
      return "bg-gray-400";
  }
}

export function getMapProjectProgress(status: string) {
  switch (status) {
    case "DISETUJUI":
      return 30;
    case "BERJALAN":
      return 60;
    case "SELESAI":
      return 100;
    case "USULAN":
    default:
      return 10;
  }
}

export function formatRupiahFull(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function filterMapProjects({
  projects,
  searchQuery,
  status,
}: {
  projects: MapProject[];
  searchQuery: string;
  status: MapStatusFilter;
}) {
  const normalizedSearchQuery = searchQuery.toLowerCase();

  return projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(normalizedSearchQuery) ||
      project.category.toLowerCase().includes(normalizedSearchQuery);
    const matchesStatus = status === "All" || project.status === status;

    return matchesSearch && matchesStatus;
  });
}

export function getMapProjectDuration(project: MapProject) {
  if (!project.startDate || !project.endDate) return "Not specified";

  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    return `${Math.floor(diffDays / 30)} Months`;
  }

  return `${diffDays} Days`;
}

export function getVoteDelta(
  action: MapVoteAction,
  voteType: MapVoteChoice,
  currentVote?: MapVoteChoice,
): VoteDelta {
  const previousVote =
    currentVote ??
    (action === "DELETED"
      ? voteType
      : action === "UPDATED"
        ? getOppositeVote(voteType)
        : null);
  const nextVote = action === "DELETED" ? null : voteType;

  return {
    nextVote,
    agreeDelta:
      (nextVote === "agree" ? 1 : 0) - (previousVote === "agree" ? 1 : 0),
    disagreeDelta:
      (nextVote === "disagree" ? 1 : 0) - (previousVote === "disagree" ? 1 : 0),
  };
}

export function updateMapProjectVotes(
  project: MapProject,
  agreeDelta: number,
  disagreeDelta: number,
) {
  return {
    ...project,
    votes: {
      agree: Math.max(0, project.votes.agree + agreeDelta),
      disagree: Math.max(0, project.votes.disagree + disagreeDelta),
    },
  };
}

function getOppositeVote(voteType: MapVoteChoice): MapVoteChoice {
  return voteType === "agree" ? "disagree" : "agree";
}
