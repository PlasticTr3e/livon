"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { cn, Badge, Button, Card } from "@/components/ui/WireframePrimitives";
import { useUser } from "@/context/UserContext";
import {
  MapPin,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  TrendingUp,
  X,
  Menu,
  Newspaper,
  Search,
  Layers,
  Activity,
  CheckCircle,
  Wallet,
  Users,
  Coins,
} from "lucide-react";

// Dynamic import for Leaflet map (client-side only)
const MapLeaflet = dynamic(
  () =>
    import("../../../components/mapLeaflet").then((mod) => ({
      default: mod.MapLeaflet,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-green-100 via-slate-100 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm border border-white/50 dark:border-slate-700 animate-pulse">
            <MapPin className="w-10 h-10 text-green-500 dark:text-green-400" />
          </div>
          <p className="text-green-700 dark:text-green-400 font-bold">
            Loading Map...
          </p>
        </div>
      </div>
    ),
  },
);

const mapStatusToUI = (status: string) => {
  switch (status) {
    case "USULAN":
      return "Planning";
    case "DISETUJUI":
      return "Funding";
    case "BERJALAN":
      return "Under Construction";
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
    case "Under Construction":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    case "Completed":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700";
    default:
      return "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300";
  }
};

const getProgressColor = (status: string) => {
  switch (status) {
    case "Planning":
      return "bg-gradient-to-r from-blue-400 to-blue-600";
    case "Funding":
      return "bg-gradient-to-r from-yellow-400 to-amber-500";
    case "Under Construction":
      return "bg-gradient-to-r from-orange-400 to-orange-600";
    case "Completed":
      return "bg-gradient-to-r from-green-400 to-green-600";
    default:
      return "bg-gray-400";
  }
};

// const getMarkerStyle = (status: string) => {
//   switch (status) {
//     case "Planning": return { bg: "bg-blue-100 dark:bg-blue-900/40 border-blue-500", icon: "text-blue-600 dark:text-blue-400" };
//     case "Funding": return { bg: "bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500", icon: "text-yellow-600 dark:text-yellow-400" };
//     case "Under Construction": return { bg: "bg-orange-100 dark:bg-orange-900/40 border-orange-500", icon: "text-orange-600 dark:text-orange-400" };
//     case "Completed": return { bg: "bg-green-100 dark:bg-green-900/40 border-green-500", icon: "text-green-600 dark:text-green-400" };
//     default: return { bg: "bg-gray-100 border-gray-400", icon: "text-gray-500" };
//   }
// };

interface CommentMapData {
  id: string;
  author: string;
  text: string;
  timestamp: string;
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
}

const formatRupiahCompact = (value: number) => {
  if (value >= 1e9) return `Rp ${Number((value / 1e9).toFixed(1))} Miliar`;
  if (value >= 1e6) return `Rp ${Number((value / 1e6).toFixed(1))} JT`;
  if (value >= 1e3) return `Rp ${Number((value / 1e3).toFixed(1))} RB`;
  return `Rp ${value}`;
};

export default function MapPage() {
  const router = useRouter();
  const { userRole } = useUser();
  const [projects, setProjects] = useState<ProjectMapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectMapData | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [userVotes, setUserVotes] = useState<
    Record<string, "agree" | "disagree">
  >({});

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

                return {
                  id: d.id,
                  name: d.title,
                  address: "Area Jakarta",
                  category: d.category?.name || "Uncategorized",
                  status: mapStatusToUI(d.status),
                  progress: progress,
                  budget: Number(d.budgetTarget) || 0,
                  fundsCollected: Number(d.currentFunding) || 0,
                  votes: { agree: d._count?.votes || 0, disagree: 0 },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  comments: d.comments?.map((c: any) => ({
                    id: c.id,
                    author: c.user?.name || "Resident",
                    text: c.content,
                    timestamp: new Date(c.createdAt).toLocaleDateString(),
                  })) || [
                    {
                      id: "mock-1",
                      author: "Budi S.",
                      text: "This project will really help the community!",
                      timestamp: "Today",
                    },
                  ],
                  lat: d.latitude,
                  lng: d.longitude,
                  imageUrl:
                    d.imageUrl ||
                    d.images?.[0]?.url ||
                    "https://images.unsplash.com/photo-1541888009623-fb944e8bc1a8?q=80&w=400&auto=format&fit=crop",
                };
              } catch (e) {
                console.error("Error fetching project details", e);
                return null;
              }
            }),
          );
          setProjects(fullProjects.filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to fetch map projects", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleVote = (projectId: string, voteType: "agree" | "disagree") => {
    if (!userRole || userRole !== "Resident") {
      alert("Hanya Resident yang bisa voting");
      return;
    }

    setUserVotes((prev) => {
      const currentVote = prev[projectId];
      const newVotes = { ...prev };

      if (currentVote === voteType) {
        // Remove vote if clicking same button
        delete newVotes[projectId];
        setSelectedProject((prevProj: ProjectMapData | null) => {
          if (!prevProj || prevProj.id !== projectId) return prevProj;
          return {
            ...prevProj,
            votes: {
              agree:
                voteType === "agree"
                  ? prevProj.votes.agree - 1
                  : prevProj.votes.agree,
              disagree:
                voteType === "disagree"
                  ? prevProj.votes.disagree - 1
                  : prevProj.votes.disagree,
            },
          };
        });
      } else {
        // Add or change vote
        newVotes[projectId] = voteType;
        setSelectedProject((prevProj: ProjectMapData | null) => {
          if (!prevProj || prevProj.id !== projectId) return prevProj;
          return {
            ...prevProj,
            votes: {
              agree:
                (voteType === "agree" ? 1 : 0) +
                (currentVote === "agree" ? -1 : 0) +
                prevProj.votes.agree,
              disagree:
                (voteType === "disagree" ? 1 : 0) +
                (currentVote === "disagree" ? -1 : 0) +
                prevProj.votes.disagree,
            },
          };
        });
      }
      return newVotes;
    });
  };

  const handleDonate = (projectId: string) => {
    router.push(`/crowdfunding/${projectId}`);
  };

  const handleViewDetail = (projectId: string) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100">
      {/* Mobile Toggle */}
      <div className="absolute top-4 left-4 z-20 md:hidden">
        <Button
          variant="outline"
          className="bg-white dark:bg-slate-800 p-2 shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5 text-green-700 dark:text-green-400" />
        </Button>
      </div>

      {/* ── Left Sidebar ── */}
      <div
        className={cn(
          "absolute md:relative z-10 w-80 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-transform duration-300 ease-in-out shadow-lg md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 dark:text-slate-200">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter pills */}
          <div className="flex gap-1 flex-wrap">
            {[
              "All",
              "Planning",
              "Funding",
              "Under Construction",
              "Completed",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all",
                  filterStatus === s
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-600",
                )}
              >
                {s}
              </button>
            ))}
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
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm leading-tight pr-2 text-gray-800 dark:text-slate-200">
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

                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 line-clamp-1">
                  {project.address}
                </p>

                {/* Progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">
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

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-medium text-gray-700 dark:text-slate-300">
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
            <MapLeaflet
              projects={filteredProjects}
              selectedProject={selectedProject}
              onProjectSelect={(project: { id: string }) => {
                const fullProject = filteredProjects.find(
                  (item) => item.id === project.id,
                );
                if (fullProject) setSelectedProject(fullProject);
              }}
            />
          )}
        </div>

        {/* Legend / Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md dark:bg-slate-900/90 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 p-3">
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
                { status: "Under Construction", label: "Construction" },
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
          <div className="absolute top-4 left-4 md:left-auto md:right-4 z-30 w-full max-w-[280px] bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col max-h-[calc(100vh-10rem)]">
            {/* Project Photo / Image Area */}
            <div className="relative w-full h-28 bg-gray-200 dark:bg-slate-800 rounded-t-2xl overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  selectedProject.imageUrl ||
                  "https://images.unsplash.com/photo-1541888009623-fb944e8bc1a8?q=80&w=400&auto=format&fit=crop"
                }
                alt="Project thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if unsplash image fails to load
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop";
                }}
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
                  <span className="text-[9px] font-medium text-gray-500 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {selectedProject.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-slate-100 mb-0.5">
                  {selectedProject.name}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                  {selectedProject.address}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-3 space-y-3">
              {/* Core Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                  <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                    <Wallet className="w-2.5 h-2.5" /> Budget
                  </span>
                  <span className="font-bold text-xs text-gray-900 dark:text-slate-100">
                    {formatRupiahCompact(selectedProject.budget)}
                  </span>
                </div>
                <div className="flex flex-col p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
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
                    <span className="font-bold text-[10px] text-gray-900 dark:text-slate-100">
                      {selectedProject.progress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Funds Collected (Only for Funding, Construction, and Completed) */}
              {(selectedProject.status === "Funding" ||
                selectedProject.status === "Under Construction" ||
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
                      {formatRupiahCompact(selectedProject.fundsCollected)}
                    </span>
                    <span className="text-[9px] text-green-600/70 font-medium leading-none">
                      / {formatRupiahCompact(selectedProject.budget)}
                    </span>
                  </div>
                </div>
              )}

              {/* Resident Actions */}
              {userRole === "Resident" && (
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                      Feedback
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(selectedProject.id, "agree")}
                        className={cn(
                          "flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all border",
                          userVotes[selectedProject.id] === "agree"
                            ? "bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/20"
                            : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-green-500 hover:text-green-600",
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />{" "}
                        {selectedProject.votes.agree}
                      </button>
                      <button
                        onClick={() =>
                          handleVote(selectedProject.id, "disagree")
                        }
                        className={cn(
                          "flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all border",
                          userVotes[selectedProject.id] === "disagree"
                            ? "bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20"
                            : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600",
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
                          className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800"
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-[9px] font-bold text-gray-800 dark:text-slate-200">
                              {comment.author}
                            </p>
                            <p className="text-[8px] text-gray-400">
                              {comment.timestamp}
                            </p>
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-slate-400 leading-tight line-clamp-1">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg border border-gray-100 dark:border-slate-800 text-center">
                    <p className="text-[9px] text-gray-500 italic">
                      No comments yet. Be the first!
                    </p>
                  </div>
                )}
              </div>

              {/* Admin view / Manager view*/}
              {(userRole === "Admin" || userRole === "Manager") && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                      <p className="text-[9px] text-gray-400 mb-0.5 flex items-center font-semibold uppercase">
                        <Users className="w-2.5 h-2.5 mr-1" /> Votes
                      </p>
                      <p className="font-bold text-xs text-gray-900 dark:text-slate-100">
                        {selectedProject.votes.agree +
                          selectedProject.votes.disagree}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-800">
                      <p className="text-[9px] text-gray-400 mb-0.5 flex items-center font-semibold uppercase">
                        <Clock className="w-2.5 h-2.5 mr-1" /> Duration
                      </p>
                      <p className="font-bold text-xs text-gray-900 dark:text-slate-100">
                        3 Months
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 pt-0">
              <button
                onClick={() => handleViewDetail(selectedProject.id)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Bottom Stats Bar ── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden md:flex scale-90 lg:scale-100 origin-bottom">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-100 dark:border-slate-800 shadow-xl rounded-full px-5 py-2 flex items-center gap-4">
            {[
              {
                label: "Total Projects",
                value: projects.length,
                icon: Layers,
                color:
                  "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
              },
              {
                label: "Funding",
                value: projects.filter((p) => p.status === "Funding").length,
                icon: Wallet,
                color:
                  "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10",
              },
              {
                label: "Construction",
                value: projects.filter((p) => p.status === "Under Construction")
                  .length,
                icon: Activity,
                color:
                  "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10",
              },
              {
                label: "Completed",
                value: projects.filter((p) => p.status === "Completed").length,
                icon: CheckCircle,
                color:
                  "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
              },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-full", stat.color)}>
                  <stat.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">
                    {stat.label}
                  </p>
                  <p className="font-bold text-xs text-gray-900 dark:text-slate-100 leading-none">
                    {stat.value}
                  </p>
                </div>
                {idx < 3 && (
                  <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 ml-3" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="h-16 md:hidden w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 absolute bottom-0 z-20 flex justify-around items-center px-4">
          <Link
            href="/app/map"
            className="flex flex-col items-center text-green-600 dark:text-green-400"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Map</span>
          </Link>
          <Link
            href="/app/crowdfunding"
            className="flex flex-col items-center text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Dana</span>
          </Link>
          <Link
            href="/app/news"
            className="flex flex-col items-center text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400"
          >
            <Newspaper className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Berita</span>
          </Link>
          <button
            className="flex flex-col items-center text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] mt-1 font-medium">Proyek</span>
          </button>
        </div>
      </div>
    </div>
  );
}
