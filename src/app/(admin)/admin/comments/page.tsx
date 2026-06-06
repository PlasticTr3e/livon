"use client";
import { useState, useEffect } from "react";

import { Card, Badge, Input, cn } from "@/components/ui/WireframePrimitives";
import {
  MessageSquare,
  Search,
  Trash2,
  ShieldAlert,
  CheckCircle,
  Filter,
  SearchX,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";

type CommentItem = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  role: "Resident" | "Manager" | "Admin";
  projectName: string;
  projectId: string | null;
  flag: boolean;
  userId: string;
  createdAt: string;
  sentiment: "Positive" | "Negative" | "Neutral";
};

export default function CommentMonitorPage() {
  const [allComments, setAllComments] = useState<CommentItem[]>([]);
  const [allProjects, setAllProjects] = useState<
    { id: string; title: string; createdAt: string }[]
  >([]);
  const [selectedProject, setSelectedProject] = useState<{
    id: string | null;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectSort, setProjectSort] = useState<
    "latest" | "oldest" | "positive" | "negative"
  >("latest");
  const [sentimentFilter, setSentimentFilter] = useState<
    "all" | "Positive" | "Neutral" | "Negative" | "flagged"
  >("all");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const analyzeSentiment = (
    label?: string,
  ): "Positive" | "Negative" | "Neutral" => {
    if (!label) return "Neutral";
    
    const upperLabel = label.toUpperCase();
    if (upperLabel === "POSITIF") return "Positive";
    if (upperLabel === "NEGATIF") return "Negative";
    return "Neutral";
  };

  const getSentimentReason = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "Komentar ini mengandung apresiasi atau dukungan yang membangun atmosfer positif bagi komunitas.";
      case "Negative":
        return "Komentar ini terdeteksi mengandung keluhan atau sentimen negatif yang mungkin perlu ditinjau lebih lanjut.";
      default:
        return "Komentar ini bersifat informatif atau berisi pernyataan umum tanpa indikasi emosi yang kuat.";
    }
  };

  const mapRole = (role: string): "Resident" | "Manager" | "Admin" => {
    const upperRole = role.toUpperCase();
    if (upperRole.includes("ADMIN")) return "Admin";
    if (upperRole.includes("MANAGER")) return "Manager";
    return "Resident";
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");

        const [commentsRes, projectsRes] = await Promise.all([
          fetch("/api/comments/admin", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch("/api/projects", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!commentsRes.ok || !projectsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [commentsResult, projectsResult] = await Promise.all([
          commentsRes.json(),
          projectsRes.json(),
        ]);

        const commentsData = commentsResult.data || [];
        const projectsData = projectsResult.data || [];

        setAllProjects(
          projectsData.map(
            (p: {
              id: string;
              title?: string;
              name?: string;
              createdAt: string;
            }) => ({
              id: p.id,
              title: p.title || p.name || "Untitled Project",
              createdAt: p.createdAt,
            }),
          ),
        );

        const transformedComments: CommentItem[] = commentsData.map(
          (comment: {
            id: string;
            text: string;
            sentimentScore?: number;
            user?: { email?: string; role?: string };
            createdAt: string;
            project?: { title?: string };
            news?: { title?: string };
            projectId: string;
            sentimentLabel?: string;
            userId: string;
          }) => {
            const sentiment = analyzeSentiment(comment.sentimentLabel);

            return {
              id: comment.id,
              author: comment.user?.email || "Unknown User",
              text: comment.text || "",
              timestamp: formatFullDate(comment.createdAt),
              role: mapRole(comment.user?.role || "WARGA"),
              projectName:
                comment.project?.title || comment.news?.title || "News",
              projectId: comment.projectId,
              flag:
                comment.sentimentLabel === "NEGATIF" ||
                sentiment === "Negative",
              userId: comment.userId,
              createdAt: comment.createdAt,
              sentiment: sentiment,
            };
          },
        );

        setAllComments(transformedComments);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAllComments([]);
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem("livon-token");
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setDeletedIds((prev) => [...prev, commentId]);
      setAllComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const sentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case "Positive":
        return "bg-green-100 text-green-700 border-green-300";
      case "Negative":
        return "bg-red-100 text-red-600 border-red-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  };

  const getRoleStyle = (role: "Resident" | "Manager" | "Admin") => {
    switch (role) {
      case "Admin":
        return "bg-yellow-100 text-yellow-700 border-2 border-yellow-300";
      case "Manager":
        return "bg-blue-100 text-blue-700 border-2 border-blue-300";
      default:
        return "bg-green-100 text-green-700 border-2 border-green-300";
    }
  };

  const projectsWithComments = [
    ...(allComments.some((c) => !c.projectId)
      ? [
          {
            id: null,
            name: "News",
            firstCommentDate:
              allComments.find((c) => !c.projectId)?.createdAt ||
              new Date().toISOString(),
          },
        ]
      : []),
    ...allProjects.map((p) => ({
      id: p.id,
      name: p.title,
      firstCommentDate: p.createdAt,
    })),
  ].map((p) => {
    const projectComments = allComments.filter((c) => c.projectId === p.id);
    return {
      ...p,
      count: projectComments.length,
      flaggedCount: projectComments.filter((c) => c.flag).length,
      positiveCount: projectComments.filter((c) => c.sentiment === "Positive")
        .length,
      negativeCount: projectComments.filter((c) => c.sentiment === "Negative")
        .length,
      latestCommentDate:
        projectComments.length > 0
          ? projectComments.reduce(
              (max, c) => (c.createdAt > max ? c.createdAt : max),
              projectComments[0].createdAt,
            )
          : p.firstCommentDate,
    };
  });

  const sortedProjects = projectsWithComments
    .filter((p) => {
      const matchSearch = p.name
        .toLowerCase()
        .includes(projectSearchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (projectSort === "positive") return p.positiveCount > 0;
      if (projectSort === "negative") return p.negativeCount > 0;

      return true;
    })
    .sort((a, b) => {
      const dateA = a.latestCommentDate || new Date(0).toISOString();
      const dateB = b.latestCommentDate || new Date(0).toISOString();

      if (projectSort === "latest") return dateB.localeCompare(dateA);
      if (projectSort === "oldest") return dateA.localeCompare(dateB);
      if (projectSort === "positive") return b.positiveCount - a.positiveCount;
      if (projectSort === "negative") return b.negativeCount - a.negativeCount;
      return 0;
    });

  const insights = {
    total: allComments.length,
    flagged: allComments.filter((c) => c.flag).length,
    positiveRate:
      allComments.length > 0
        ? Math.round(
            (allComments.filter((c) => c.sentiment === "Positive").length /
              allComments.length) *
              100,
          )
        : 0,
    toxicityRate:
      allComments.length > 0
        ? Math.round(
            (allComments.filter((c) => c.flag).length / allComments.length) *
              100,
          )
        : 0,
  };

  const filtered = allComments.filter((c) => {
    if (deletedIds.includes(c.id)) return false;
    if (selectedProject && c.projectId !== selectedProject.id) return false;

    const matchSearch =
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (sentimentFilter === "all") return true;
    if (sentimentFilter === "flagged") return c.flag;
    return c.sentiment === sentimentFilter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto w-full">
      {selectedProject && (
        <div className="sticky top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center shadow-sm">
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Back to Menu</span>
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Comments Management
            </h1>
            <p className="text-gray-500 dark:text-white text-sm mt-0.5">
              {selectedProject
                ? `Managing comments for "${selectedProject.name}"`
                : "Select a project to monitor and manage discussions."}
            </p>
          </div>
        </div>

        {!selectedProject ? (
          <div className="space-y-6">
            {" "}
            {/* Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-green-100 dark:border-gray-800 dark:bg-[#1F2937] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Total Comments
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {insights.total}
                  </p>
                </div>
              </Card>
              <Card className="p-4 border-red-100 dark:border-gray-800 dark:bg-[#1F2937] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Toxicity
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {insights.toxicityRate}%
                  </p>
                </div>
              </Card>
              <Card className="p-4 border-blue-100 dark:border-gray-800 dark:bg-[#1F2937] flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-white">
                    Positivity
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {insights.positiveRate}%
                  </p>
                </div>
              </Card>
            </div>
            {/* Filters Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                Project Dashboard
              </h2>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    className="pl-9 border-green-200 w-full"
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative w-32 md:w-48">
                  <select
                    value={projectSort}
                    onChange={(e) =>
                      setProjectSort(
                        e.target.value as
                          | "latest"
                          | "oldest"
                          | "positive"
                          | "negative",
                      )
                    }
                    className="w-full h-10 pl-9 pr-8 bg-white dark:bg-[#1F2937] border border-green-200 dark:border-gray-800 rounded-xl text-xs md:text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="latest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="positive">Most Positive</option>
                    <option value="negative">Most Negative</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                    <Filter className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse"
                  />
                ))
              ) : sortedProjects.length > 0 ? (
                sortedProjects.map((p) => (
                  <Card
                    key={p.id || "news"}
                    className="p-5 border-green-100 dark:border-gray-800 dark:bg-[#1F2937] hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                    onClick={() =>
                      setSelectedProject({ id: p.id, name: p.name })
                    }
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {p.flaggedCount > 0 && (
                          <Badge className="bg-red-50 text-red-600 border-red-100 text-[9px] px-1.5">
                            {p.flaggedCount} Toxic
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors line-clamp-1 mb-3">
                      {p.name}
                    </h3>

                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white">
                        <span>Sentiment Breakdown</span>
                      </div>
                      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{
                            width: `${p.count > 0 ? (p.positiveCount / p.count) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="bg-gray-300 h-full transition-all"
                          style={{
                            width: `${p.count > 0 ? ((p.count - p.positiveCount - p.negativeCount) / p.count) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="bg-red-500 h-full transition-all"
                          style={{
                            width: `${p.count > 0 ? (p.negativeCount / p.count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-green-600">
                          {p.positiveCount} Pos
                        </span>
                        <span className="text-red-600">
                          {p.negativeCount} Neg
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <SearchX className="w-12 h-12 opacity-20" />
                  <p className="font-medium">
                    No projects found matching your search.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-5 border-green-100 dark:border-gray-800 dark:bg-[#1F2937] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-9 border-green-200 w-full"
                  placeholder="Search comments or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-44">
                  <select
                    value={sentimentFilter}
                    onChange={(e) =>
                      setSentimentFilter(
                        e.target.value as
                          | "all"
                          | "Positive"
                          | "Neutral"
                          | "Negative"
                          | "flagged",
                      )
                    }
                    className="w-full h-10 pl-10 pr-8 bg-white dark:bg-[#1F2937] border border-green-200 dark:border-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="all">All Sentiments</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                    <option value="Neutral">Neutral</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-medium">
                    Memuat komentar...
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 font-medium">
                    Tidak ada komentar yang ditemukan di proyek ini.
                  </p>
                </div>
              ) : (
                filtered.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      "p-4 border rounded-xl flex items-start gap-4 bg-white dark:bg-[#1F2937] hover:bg-green-50 dark:hover:bg-slate-700 transition-colors",
                      comment.flag
                        ? "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
                        : "border-gray-100 dark:border-gray-800",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                        getRoleStyle(comment.role),
                      )}
                    >
                      {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">
                            {comment.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {comment.flag && (
                            <Badge className="bg-red-100 text-red-600 border-red-300 flex items-center gap-0.5 text-[10px]">
                              <ShieldAlert className="w-3 h-3" /> Ditandai
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              "text-[10px]",
                              sentimentStyle(comment.sentiment),
                            )}
                          >
                            {comment.sentiment}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-white text-sm leading-relaxed">
                        {comment.text}
                      </p>

                      {/* AI Moderation Insight */}
                      <div className="mt-4 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl" />
                        <div className="relative p-4 border border-purple-100 dark:border-purple-900/30 rounded-xl bg-white/50 dark:bg-[#111827]/50 backdrop-blur-sm">
                          <div className="flex items-center justify-between mb-3 border-b border-purple-100/50 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="absolute inset-0 bg-purple-400 blur-sm opacity-20 animate-pulse" />
                                <div className="relative p-1.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white shadow-sm">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white text-base tracking-tight leading-none">
                                    AI Insight
                                  </h3>
                                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-purple-200/50">
                                    Beta
                                  </span>
                                </div>
                                <span className="block mt-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-purple-600 dark:text-purple-400 leading-none">
                                  Livon Intelligent Moderation AI
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-700 dark:text-white font-medium leading-relaxed">
                              <span className="font-bold text-purple-600">
                                Alasan:
                              </span>{" "}
                              {getSentimentReason(comment.sentiment)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                            <Calendar className="w-3 h-3" />
                            {new Date(comment.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium border-l border-gray-200 pl-3">
                            <Clock className="w-3 h-3" />
                            {new Date(comment.createdAt).toLocaleTimeString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
