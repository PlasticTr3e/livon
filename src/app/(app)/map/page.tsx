"use client";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { cn, Badge, Button, Card } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useUser } from "@/context/UserContext";
import {
  MapPin,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  X,
  Search,
  Layers,
  Activity,
  Wallet,
  Users,
  Coins,
} from "lucide-react";

const ProjectMap = dynamic(() => import("@/components/maps/ProjectMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-green-100 via-slate-100 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-[#1F2937]/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm border border-white/50 dark:border-gray-800 animate-pulse">
          <MapPin className="w-10 h-10 text-green-500 dark:text-green-400" />
        </div>
        <p className="text-green-700 dark:text-green-400 font-bold">
          Loading Map...
        </p>
      </div>
    </div>
  ),
});

const mapStatusToUI = (status: string) => {
  switch (status) {
    case "USULAN":
      return "Planning";
    case "DISETUJUI":
      return "Funding";
    case "BERJALAN":
      return "Construction";
    case "SELESAI":
      return "Completed";
    default:
      return "Planning";
  }
};

const getStatusStyle = (status: string) => {
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
};

const getProgressColor = (status: string) => {
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
};

interface CommentMapData {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface ApiMapComment {
  id: string | number;
  text?: string;
  createdAt?: string;
  user?: {
    email?: string;
  };
}

interface ProjectMapData {
  id: string;
  name: string;
  address: string;
  category: string;
  status: string;
  progress: number;
  budget: number;
  fundsCollected: number;
  votes: { agree: number; disagree: number };
  comments: CommentMapData[];
  lat: number;
  lng: number;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
}

type VoteChoice = "agree" | "disagree";
type VoteAction = "CREATED" | "UPDATED" | "DELETED";

interface ActivityFeedItem {
  type?: string;
  action?: string;
  targetId?: string | null;
}

const formatRupiahFull = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MapPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [projects, setProjects] = useState<ProjectMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectMapData | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [userVotes, setUserVotes] = useState<Record<string, VoteChoice>>({});
  const [savingVotes, setSavingVotes] = useState<Record<string, boolean>>({});

  // Listen to global app sidebar toggle
  useEffect(() => {
    const handleToggle = () =>
      setSidebarOpen((isOpen) => {
        if (!isOpen) {
          setSelectedProject(null);
        }

        return !isOpen;
      });

    window.addEventListener("toggle-app-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-app-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/projects", { headers });
        if (!res.ok) throw new Error("Failed to fetch projects");
        const json = await res.json();

        if (json.data) {
          const fullProjects = await Promise.all(
            json.data.map(async (p: { id: string }) => {
              try {
                const detailRes = await fetch(`/api/projects/${p.id}`, {
                  headers,
                });
                const detailJson = await detailRes.json();
                const d = detailJson.data;
                if (!d) return null;

                let progress = 10;
                if (d.status === "USULAN") progress = 10;
                else if (d.status === "DISETUJUI") progress = 30;
                else if (d.status === "BERJALAN") progress = 60;
                else if (d.status === "SELESAI") progress = 100;

                // Lokasi: prioritas lat/lng, lalu address, lalu '-'
                let location = "-";
                if (
                  typeof d.latitude === "number" &&
                  typeof d.longitude === "number" &&
                  !isNaN(d.latitude) &&
                  !isNaN(d.longitude)
                ) {
                  location = `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`;
                } else if (d.address) {
                  location = d.address;
                }

                let commentsList: CommentMapData[] = [];
                try {
                  const commentsRes = await fetch(
                    `/api/comments?projectId=${d.id}`,
                    { headers },
                  );
                  const commentsJson = await commentsRes.json();
                  if (commentsJson.data && Array.isArray(commentsJson.data)) {
                    commentsList = commentsJson.data.map(
                      (c: ApiMapComment) => ({
                        id: String(c.id),
                        author: c.user?.email || "Resident",
                        text: c.text || "",
                        timestamp: c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString()
                          : "-",
                      }),
                    );
                  }
                } catch (e) {
                  console.error("Failed to fetch comments for map", e);
                }

                return {
                  id: d.id,
                  name: d.title,
                  address: location,
                  category: d.category?.name || "Uncategorized",
                  status: mapStatusToUI(d.status),
                  progress: progress,
                  budget: Number(d.budgetTarget) || 0,
                  fundsCollected: Number(d.currentFunding) || 0,
                  votes: { agree: d._count?.votes || 0, disagree: 0 },
                  comments: commentsList,
                  lat: d.latitude,
                  lng: d.longitude,
                  imageUrl:
                    (Array.isArray(d.imageUrls) && d.imageUrls.length > 0
                      ? d.imageUrls[0]
                      : Array.isArray(d.imageUrl) && d.imageUrl.length > 0
                        ? d.imageUrl[0]
                        : typeof d.imageUrl === "string" && d.imageUrl
                          ? d.imageUrl
                          : d.images?.[0]?.url) ||
                    "https://images.unsplash.com/photo-1541888009623-fb944e8bc1a8?q=80&w=400&auto=format&fit=crop",
                  startDate: d.startDate,
                  endDate: d.endDate,
                };
              } catch (e) {
                console.error("Error fetching project details", e);
                return null;
              }
            }),
          );
          setProjects(fullProjects.filter(Boolean));

          if (token && userRole === "resident") {
            try {
              const activityRes = await fetch(
                "/api/users/activity?limit=1000",
                {
                  headers,
                },
              );
              const activityJson = await activityRes.json();
              const activityItems: ActivityFeedItem[] = Array.isArray(
                activityJson.data?.data,
              )
                ? activityJson.data.data
                : Array.isArray(activityJson.data)
                  ? activityJson.data
                  : [];

              const nextUserVotes = activityItems.reduce<
                Record<string, VoteChoice>
              >((acc, item) => {
                if (item.type !== "VOTE" || !item.targetId) return acc;
                if (item.action?.toLowerCase().startsWith("upvoted")) {
                  acc[item.targetId] = "agree";
                } else if (item.action?.toLowerCase().startsWith("downvoted")) {
                  acc[item.targetId] = "disagree";
                }
                return acc;
              }, {});

              setUserVotes(nextUserVotes);
            } catch (e) {
              console.error("Failed to load current user votes", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch map projects", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userRole]);

  const filteredProjects = useMemo(() => {
    const normalizedSearchQuery = searchQuery.toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(normalizedSearchQuery) ||
        project.category.toLowerCase().includes(normalizedSearchQuery);
      const matchesStatus =
        filterStatus === "All" || project.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, projects, searchQuery]);

  const getOppositeVote = (voteType: VoteChoice): VoteChoice =>
    voteType === "agree" ? "disagree" : "agree";

  const getVoteDelta = (
    action: VoteAction,
    voteType: VoteChoice,
    currentVote?: VoteChoice,
  ) => {
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
        (nextVote === "disagree" ? 1 : 0) -
        (previousVote === "disagree" ? 1 : 0),
    };
  };

  const handleVote = async (projectId: string, voteType: VoteChoice) => {
    if (!userRole || userRole !== "resident") {
      alert("Hanya resident yang bisa voting");
      return;
    }

    if (savingVotes[projectId]) return;

    const token = localStorage.getItem("livon-token");
    if (!token) {
      alert("Silakan login untuk memberikan vote.");
      return;
    }

    setSavingVotes((prev) => ({ ...prev, [projectId]: true }));

    try {
      const currentVote = userVotes[projectId];

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          type: voteType === "agree" ? "UPVOTE" : "DOWNVOTE",
        }),
      });

      const responseData = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error("Gagal menyimpan vote");
      }

      const action = (
        ["CREATED", "UPDATED", "DELETED"].includes(responseData?.action)
          ? responseData.action
          : res.status === 201
            ? "CREATED"
            : currentVote === voteType
              ? "DELETED"
              : currentVote
                ? "UPDATED"
                : "CREATED"
      ) as VoteAction;
      const { nextVote, agreeDelta, disagreeDelta } = getVoteDelta(
        action,
        voteType,
        currentVote,
      );

      setUserVotes((prev) => {
        const next = { ...prev };
        if (nextVote) next[projectId] = nextVote;
        else delete next[projectId];
        return next;
      });

      const updateVotes = (proj: ProjectMapData) => ({
        ...proj,
        votes: {
          agree: Math.max(0, proj.votes.agree + agreeDelta),
          disagree: Math.max(0, proj.votes.disagree + disagreeDelta),
        },
      });

      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updateVotes(p) : p)),
      );
      setSelectedProject((prev) =>
        prev && prev.id === projectId ? updateVotes(prev) : prev,
      );
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan vote, silakan coba lagi.");
    } finally {
      setSavingVotes((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const handleDonate = (projectId: string) => {
    router.push(`/crowdfunding/${projectId}`);
  };

  const handleViewDetail = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  const handleProjectCardClick = (project: ProjectMapData) => {
    if (window.innerWidth < 768) {
      router.push(`/project/${project.id}`);
      return;
    }

    setSelectedProject(project);
  };

  const handleMapProjectSelect = (project: { id: string }) => {
    const fullProject = filteredProjects.find((item) => item.id === project.id);
    if (!fullProject) return;

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    setSelectedProject(fullProject);
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden">
      {/* ── Left Sidebar ── */}
      <div
        className={cn(
          "absolute md:relative z-[2147483646] w-80 h-full bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out shadow-lg md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 dark:text-white">
              Projects
            </h2>
            <Button
              variant="ghost"
              className="md:hidden p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-white" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#1F2937] text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter pills */}
          <div className="flex gap-1 flex-wrap">
            {["All", "Planning", "Funding", "Construction", "Completed"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all",
                    filterStatus === s
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-sm"
                      : "bg-white dark:bg-[#1F2937] text-gray-600 dark:text-white border-gray-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-600",
                  )}
                >
                  {s}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isLoading ? (
            <p className="text-center text-sm text-gray-500 mt-5">
              Memuat proyek...
            </p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-center text-sm text-gray-500 mt-5">
              Tidak ada proyek yang ditemukan.
            </p>
          ) : (
            filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "p-3 cursor-pointer transition-all",
                  selectedProject?.id === project.id
                    ? "border-green-500 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-900 bg-green-50 dark:bg-green-900/20"
                    : "hover:border-green-300 dark:hover:border-green-700 hover:shadow-md",
                )}
                onClick={() => handleProjectCardClick(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm leading-tight pr-2 text-gray-800 dark:text-white">
                    {project.name}
                  </h3>
                  <Badge
                    className={cn(
                      "text-[10px] shrink-0",
                      getStatusStyle(project.status),
                    )}
                  >
                    {project.status}
                  </Badge>
                </div>

                <p className="text-xs text-gray-400 dark:text-white mb-2 line-clamp-1">
                  {project.address}
                </p>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-white mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-700 dark:text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        getProgressColor(project.status),
                      )}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-white">
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-medium text-gray-700 dark:text-white">
                      {project.category}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="w-3 h-3" /> {project.votes.agree}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="p-1 h-auto text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── Map Area ── */}
      <div className="flex-1 relative flex flex-col h-full">
        {/* Leaflet Map */}
        <div className="w-full h-full relative">
          {!isLoading && (
            <ProjectMap
              projects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={handleMapProjectSelect}
            />
          )}
        </div>

        {/* Legend / Map Controls */}
        <div
          className={cn(
            "absolute left-4 top-4 z-[900] flex flex-col gap-2 transition-opacity duration-200",
            sidebarOpen
              ? "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100"
              : "opacity-100",
          )}
        >
          <div className="bg-white/90 backdrop-blur-md dark:bg-[#111827]/90 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-3">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Legend
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { status: "Planning", label: "Planning" },
                { status: "Funding", label: "Funding" },
                { status: "Construction", label: "Construction" },
                { status: "Completed", label: "Completed" },
              ].map(({ status, label }) => (
                <div
                  key={status}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    getStatusStyle(status),
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current opacity-70" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Project Detail Overlay Panel ── */}
        {selectedProject && (
          <div className="absolute left-4 right-4 top-4 z-[1000] flex max-h-[calc(100dvh-10rem)] w-auto max-w-[280px] flex-col rounded-2xl border border-gray-100 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-[#111827]/95 md:left-auto md:right-4 md:w-full">
            {/* Project Photo / Image Area */}
            <div className="relative w-full h-28 bg-gray-200 dark:bg-[#1F2937] rounded-t-2xl overflow-hidden shrink-0">
              <ImageWithFallback
                src={
                  selectedProject.imageUrl ||
                  "https://images.unsplash.com/photo-1541888009623-fb944e8bc1a8?q=80&w=400&auto=format&fit=crop"
                }
                alt="Project thumbnail"
                fill
                sizes="280px"
                className="w-full h-full object-cover"
                fallbackSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

              <button
                className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                onClick={() => setSelectedProject(null)}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-2 left-4 flex gap-2">
                <Badge
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 border-0 shadow-sm",
                    getStatusStyle(selectedProject.status),
                  )}
                >
                  {selectedProject.status}
                </Badge>
              </div>
            </div>

            {/* Panel Header */}
            <div className="px-4 pt-3 pb-2 flex justify-between items-start">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-medium text-gray-500 bg-gray-100 dark:bg-[#1F2937] px-1.5 py-0.5 rounded-full">
                    {selectedProject.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-white mb-0.5">
                  {selectedProject.name}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-white flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                  {selectedProject.address}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-3 space-y-3">
              {/* Core Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-2 bg-gray-50 dark:bg-[#1F2937]/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Wallet className="w-2.5 h-2.5" /> Budget
                  </span>
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    {formatRupiahFull(selectedProject.budget)}
                  </span>
                </div>
                <div className="flex flex-col p-2 bg-gray-50 dark:bg-[#1F2937]/50 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" /> Progress
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          getProgressColor(selectedProject.status),
                        )}
                        style={{ width: `${selectedProject.progress}%` }}
                      />
                    </div>
                    <span className="font-bold text-[10px] text-gray-900 dark:text-white">
                      {selectedProject.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Funds Collected (Only for Funding, Construction, and Completed) */}
              {(selectedProject.status === "Funding" ||
                selectedProject.status === "Construction" ||
                selectedProject.status === "Completed") && (
                <div className="flex flex-col p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-2.5 h-2.5" /> Funds Collected
                    </span>
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400">
                      {selectedProject.budget > 0
                        ? (
                            (selectedProject.fundsCollected /
                              selectedProject.budget) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-1 bg-green-200/50 dark:bg-green-800/50 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(100, selectedProject.budget > 0 ? (selectedProject.fundsCollected / selectedProject.budget) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-[11px] text-green-700 dark:text-green-400 leading-none">
                      {formatRupiahFull(selectedProject.fundsCollected)}
                    </span>
                    <span className="text-[9px] text-green-600/70 font-medium leading-none">
                      / {formatRupiahFull(selectedProject.budget)}
                    </span>
                  </div>
                </div>
              )}

              {/* Resident Actions */}
              {userRole === "resident" && (
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                      Feedback
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(selectedProject.id, "agree")}
                        disabled={savingVotes[selectedProject.id]}
                        className={cn(
                          "flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all border disabled:cursor-not-allowed disabled:opacity-60",
                          userVotes[selectedProject.id] === "agree"
                            ? "bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/20"
                            : "bg-white dark:bg-[#1F2937] text-gray-600 dark:text-white border-gray-200 dark:border-gray-800 hover:border-green-500 hover:text-green-600",
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />{" "}
                        {selectedProject.votes.agree}
                      </button>
                      <button
                        onClick={() =>
                          handleVote(selectedProject.id, "disagree")
                        }
                        disabled={savingVotes[selectedProject.id]}
                        className={cn(
                          "flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all border disabled:cursor-not-allowed disabled:opacity-60",
                          userVotes[selectedProject.id] === "disagree"
                            ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20"
                            : "bg-white dark:bg-[#1F2937] text-gray-600 dark:text-white border-gray-200 dark:border-gray-800 hover:border-red-500 hover:text-red-600",
                        )}
                      >
                        <ThumbsDown className="w-3 h-3" />{" "}
                        {selectedProject.votes.disagree}
                      </button>
                    </div>
                  </div>

                  {selectedProject.status === "Funding" && (
                    <button
                      onClick={() => handleDonate(selectedProject.id)}
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-slate-900 text-white font-bold text-xs rounded-lg transition-all shadow-md"
                    >
                      Fund this project
                    </button>
                  )}
                </div>
              )}

              {/* Latest Comments */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" /> Latest Comments
                  </span>
                  <button
                    onClick={() =>
                      router.push(`/project/${selectedProject.id}#comments`)
                    }
                    className="text-[9px] font-bold text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                  >
                    See all <ChevronRight className="w-2 h-2 ml-0.5" />
                  </button>
                </div>

                {selectedProject.comments &&
                selectedProject.comments.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedProject.comments
                      .slice(0, 1)
                      .map((comment: CommentMapData) => (
                        <div
                          key={comment.id}
                          className="bg-gray-50 dark:bg-[#1F2937]/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800"
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-[9px] font-bold text-gray-800 dark:text-white">
                              {comment.author}
                            </p>
                            <p className="text-[8px] text-gray-400">
                              {comment.timestamp}
                            </p>
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-white leading-tight line-clamp-1">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-[#1F2937]/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
                    <p className="text-[9px] text-gray-500 italic">
                      No comments yet. Be the first!
                    </p>
                  </div>
                )}
              </div>

              {/* Agency view */}
              {userRole === "agency" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-[#1F2937]/50 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="text-[9px] text-gray-400 mb-0.5 flex items-center font-semibold uppercase">
                        <Users className="w-2.5 h-2.5 mr-1" /> Votes
                      </p>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">
                        {selectedProject.votes.agree +
                          selectedProject.votes.disagree}
                      </p>
                    </div>
                    {selectedProject.status === "Construction" && (
                      <div className="p-2 bg-gray-50 dark:bg-[#1F2937]/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] text-gray-400 mb-0.5 flex items-center font-semibold uppercase">
                          <Clock className="w-2.5 h-2.5 mr-1" /> Duration
                        </p>
                        <p className="font-bold text-xs text-gray-900 dark:text-white">
                          {selectedProject.startDate && selectedProject.endDate
                            ? (() => {
                                const start = new Date(
                                  selectedProject.startDate,
                                );
                                const end = new Date(selectedProject.endDate);
                                const diffTime = Math.abs(
                                  end.getTime() - start.getTime(),
                                );
                                const diffDays = Math.ceil(
                                  diffTime / (1000 * 60 * 60 * 24),
                                );
                                if (diffDays >= 30) {
                                  return `${Math.floor(diffDays / 30)} Months`;
                                }
                                return `${diffDays} Days`;
                              })()
                            : "Not specified"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 pt-0">
              <button
                onClick={() => handleViewDetail(selectedProject.id)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
