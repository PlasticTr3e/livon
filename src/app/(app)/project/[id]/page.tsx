"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, Badge, Card, cn } from "@/components/ui/WireframePrimitives";
import { useUser } from "@/context/UserContext";
import { UpdateStatusModal } from "@/components/UpdateStatusModal";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  BarChart2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  DollarSign,
  TrendingUp,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Calendar,
  CheckCircle2,
  Send,
  File,
  Building2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

// ── Local type definitions (no longer from mockData) ──────────────────────────
interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  address: string;
  contractor?: string;
  startDate: string;
  endDate: string;
  budget: number;
  fundsCollected?: number;
  progress: number;
  votes: { agree: number; disagree: number };
  comments: Comment[];
  documents: ProjectDocument[];
}

interface ApiComment {
  id: string | number;
  text?: string;
  createdAt?: string;
  user?: {
    email?: string;
    role?: string;
  };
}

interface ApiProjectPayload {
  id: string | number;
  title?: string;
  description?: string;
  status?: string;
  category?: { name?: string };
  address?: string;
  agency?: { agencyProfile?: { agencyName?: string } };
  startDate?: string;
  endDate?: string;
  budgetTarget?: string | number;
  currentFunding?: string | number;
  _count?: { votes?: number };
}

const PROJECT_STATUS_MAP: Record<string, string> = {
  USULAN: "Planning",
  DISETUJUI: "Funding",
  BERJALAN: "Construction",
  SELESAI: "Completed",
};

function mapProjectStatus(status: string) {
  return PROJECT_STATUS_MAP[status] || "Planning";
}

function formatDate(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function computeProgress(
  budget: number,
  fundsCollected?: number,
  status?: string,
) {
  if (status === "Completed") return 100;
  if (!budget || !fundsCollected) return 0;
  return Math.min(Math.round((fundsCollected / budget) * 100), 100);
}
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Planning: "bg-blue-100 text-blue-700 border-blue-300",
  Funding: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Construction: "bg-orange-100 text-orange-700 border-orange-300",
  Completed: "bg-green-100 text-green-700 border-green-300",
};

const PROGRESS_COLOR: Record<string, string> = {
  Planning: "bg-blue-500",
  Funding: "bg-yellow-500",
  Construction: "bg-orange-500",
  Completed: "bg-green-500",
};

function getFileIcon(type: string) {
  switch (type.toLowerCase()) {
    case "pdf":
      return "📄";
    case "jpg":
    case "png":
    case "jpeg":
      return "🖼️";
    case "zip":
      return "🗜️";
    case "dwg":
      return "📐";
    default:
      return "📎";
  }
}

const EMPTY_PROJECT: Project = {
  id: "",
  name: "Proyek tidak ditemukan",
  description: "",
  status: "Planning",
  category: "-",
  address: "-",
  startDate: "-",
  endDate: "-",
  budget: 0,
  progress: 0,
  votes: { agree: 0, disagree: 0 },
  comments: [],
  documents: [],
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { userRole, userName } = useUser();
  const [project, setProject] = useState<Project>({
    ...EMPTY_PROJECT,
    id: id as string,
  });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [votes, setVotes] = useState({
    agree: 0,
    disagree: 0,
  });
  const [userVote, setUserVote] = useState<"agree" | "disagree" | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    project.documents,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjectData() {
      if (!id) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const projectResponse = await apiFetch<ApiProjectPayload>(
          `/api/projects/${id}`,
          { headers },
        );
        if (projectResponse.success && projectResponse.data) {
          const payload = projectResponse.data;
          const normalizedProject: Project = {
            id: String(payload.id),
            name: String(payload.title || EMPTY_PROJECT.name),
            description: String(payload.description || ""),
            status: mapProjectStatus(String(payload.status)),
            category: String(payload.category?.name || "-"),
            address: String(payload.address || "-"),
            contractor: payload.agency?.agencyProfile?.agencyName
              ? String(payload.agency.agencyProfile.agencyName)
              : undefined,
            startDate: formatDate(payload.startDate as string),
            endDate: formatDate(payload.endDate as string),
            budget: payload.budgetTarget ? Number(payload.budgetTarget) : 0,
            fundsCollected: payload.currentFunding
              ? Number(payload.currentFunding)
              : 0,
            progress: computeProgress(
              payload.budgetTarget ? Number(payload.budgetTarget) : 0,
              payload.currentFunding ? Number(payload.currentFunding) : 0,
              mapProjectStatus(String(payload.status)),
            ),
            votes: {
              agree: Number(payload._count?.votes ?? 0),
              disagree: 0,
            },
            comments: [],
            documents: EMPTY_PROJECT.documents,
          };

          setProject(normalizedProject);
          setVotes({
            agree: Number(payload._count?.votes ?? 0),
            disagree: 0,
          });
        }

        const commentsResponse = await apiFetch<ApiComment[]>(
          `/api/comments?projectId=${id}`,
          { headers },
        );
        if (commentsResponse.success && commentsResponse.data) {
          const loadedComments: Comment[] = commentsResponse.data.map(
            (comment: ApiComment) => ({
              id: String(comment.id),
              author: String(comment.user?.email || "Anonymous"),
              role: String(comment.user?.role || "Resident"),
              text: String(comment.text || ""),
              timestamp: formatDate(comment.createdAt as string),
              likes: 0,
            }),
          );
          setComments(loadedComments);
          setCommentLikes(
            Object.fromEntries(
              loadedComments.map((comment) => [comment.id, 0]),
            ),
          );
        }
      } catch (error) {
        console.error("Failed to load project data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !id) return;

    const token = localStorage.getItem("livon-token");
    const response = await apiFetch<ApiComment>("/api/comments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectId: id,
        text: newComment.trim(),
      }),
    });

    if (!response.success) {
      console.error("Failed to post comment:", response.message);
      return;
    }

    const comment = response.data;
    if (!comment) return;

    const newCommentItem: Comment = {
      id: String(comment.id),
      author: comment.user?.email || userName || "Anonymous",
      role: comment.user?.role || userRole || "Resident",
      text: String(comment.text || newComment.trim()),
      timestamp: formatDate(comment.createdAt),
      likes: 0,
    };

    setComments((prev) => [newCommentItem, ...prev]);
    setCommentLikes((prev) => ({ ...prev, [newCommentItem.id]: 0 }));
    setNewComment("");
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timelineStages = ["Planning", "Funding", "Construction", "Completed"];
  const currentStageIndex = timelineStages.indexOf(project.status);

  const getUserIdFromToken = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1])).userId;
    } catch {
      return null;
    }
  };

  const handleVote = async (type: "agree" | "disagree") => {
    const token = localStorage.getItem("livon-token");
    if (!token) {
      alert("Silakan login untuk memberikan vote.");
      return;
    }
    const userId = getUserIdFromToken(token);
    if (!userId) {
      alert("Sesi tidak valid, silakan login ulang.");
      return;
    }

    const previousVote = userVote;
    const prevVotesObj = { ...votes };

    if (userVote === type) {
      setVotes((prev) => ({ ...prev, [type]: prev[type] - 1 }));
      setUserVote(null);
    } else {
      if (userVote) {
        setVotes((prev) => ({
          ...prev,
          [userVote]: prev[userVote] - 1,
          [type]: prev[type] + 1,
        }));
      } else {
        setVotes((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      }
      setUserVote(type);
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: id,
          userId,
          type: type === "agree" ? "UPVOTE" : "DOWNVOTE",
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan vote");
      }
    } catch (e) {
      console.error(e);
      setVotes(prevVotesObj);
      setUserVote(previousVote);
      alert("Gagal menyimpan vote, silakan coba lagi.");
    }
  };

  const handleLikeComment = (commentId: string) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + 1,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const sizeKB = file.size / 1024;
      const size =
        sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${sizeKB.toFixed(0)} KB`;
      const newDoc: ProjectDocument = {
        id: `d${Date.now()}_${Math.random()}`,
        name: file.name,
        type: ext,
        size,
        uploadedAt: new Date().toISOString().split("T")[0],
        uploadedBy: userName,
      };
      setDocuments((prev) => [...prev, newDoc]);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalVotes = votes.agree + votes.disagree;
  const agreePercent =
    totalVotes > 0 ? Math.round((votes.agree / totalVotes) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link
          href="/map"
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Kembali ke Peta</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs px-2", STATUS_STYLES[project.status])}>
            {project.status}
          </Badge>
          <Button variant="outline" className="p-2 border-green-200">
            <Share2 className="w-4 h-4 text-green-600" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("py-1 px-3", STATUS_STYLES[project.status])}>
              {project.status}
            </Badge>
            <Badge className="py-1 px-3 bg-white border-gray-200 text-gray-600">
              {project.category}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-slate-100 leading-tight">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-green-600" />
              {project.address}
            </span>
            {project.contractor && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                {project.contractor}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              {project.startDate} – {project.endDate}
            </span>
          </div>
        </div>

        <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-green-100 shadow-sm bg-green-50 flex items-center justify-center">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=80"
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-green-100">
              <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" /> Deskripsi Proyek
              </h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
                {project.description}
              </p>
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700">
                <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-5 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" /> Tahapan
                  Pengembangan
                </h3>
                <div className="relative">
                  <div className="absolute top-3 left-0 w-full h-1 bg-gray-200 dark:bg-slate-700 -z-0">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${(currentStageIndex / (timelineStages.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="relative flex justify-between z-10">
                    {timelineStages.map((stage, idx) => (
                      <div key={stage} className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full border-4 z-10 transition-all",
                            idx < currentStageIndex
                              ? "bg-green-600 border-green-600"
                              : idx === currentStageIndex
                                ? "bg-white border-green-600 ring-4 ring-green-100"
                                : "bg-white border-gray-300 dark:border-slate-600",
                          )}
                        >
                          {idx < currentStageIndex && (
                            <CheckCircle2 className="w-full h-full text-white p-0.5" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "mt-2 text-[10px] font-bold uppercase tracking-wider",
                            idx <= currentStageIndex
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-400 dark:text-slate-500",
                          )}
                        >
                          {stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-green-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" /> Dokumen Proyek
                  <span className="text-xs text-gray-500 font-normal bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {documents.length} file
                  </span>
                </h2>
                {(userRole === "Admin" || userRole === "Manager") && (
                  <Button
                    variant="outline"
                    className="text-sm flex items-center gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="w-4 h-4" /> Upload
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.zip,.dwg,.doc,.docx,.xlsx"
                  onChange={handleFileUpload}
                />
              </div>
              {(userRole === "Admin" || userRole === "Manager") && (
                <div
                  className="border-2 border-dashed border-green-200 rounded-xl p-5 mb-4 flex flex-col items-center justify-center bg-green-50 cursor-pointer hover:bg-green-100 transition-colors text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-green-700">
                    Klik atau drag &amp; drop untuk upload
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    PDF, JPG, PNG, ZIP, DWG hingga 20MB
                  </p>
                </div>
              )}
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <File className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Belum ada dokumen diunggah.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="py-3 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-xl shrink-0">
                          {getFileIcon(doc.type)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 group-hover:text-green-700 transition-colors">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {doc.size} • {doc.type} • {doc.uploadedAt} oleh{" "}
                            {doc.uploadedBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        {(userRole === "Admin" || userRole === "Manager") && (
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={() =>
                              setDocuments((prev) =>
                                prev.filter((d) => d.id !== doc.id),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {(userRole === "Admin" || userRole === "Manager") && (
              <>
                <Card className="p-6 border-green-100">
                  <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-green-600" /> Analitik
                    Proyek
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-700 mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> Total Votes
                      </p>
                      <p className="font-black text-2xl text-green-800">
                        {votes.agree + votes.disagree}
                      </p>
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-600">
                        <span className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-3 h-3" />
                          {votes.agree} Setuju
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="w-3 h-3" />
                          {votes.disagree} Tidak
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs text-blue-700 mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Estimasi
                      </p>
                      <p className="font-black text-2xl text-blue-800">3 Bln</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Target penyelesaian
                      </p>
                    </div>
                  </div>
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-2 text-sm uppercase tracking-wider">
                      Analisis Sentimen
                    </h3>
                    <div className="flex h-5 w-full rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{ width: `${agreePercent}%` }}
                      />
                      <div
                        className="bg-gray-300 dark:bg-slate-600 h-full"
                        style={{ width: `${100 - agreePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-slate-400 font-medium">
                      <span className="text-green-600">
                        Positif ({agreePercent}%)
                      </span>
                      <span>Negatif ({100 - agreePercent}%)</span>
                    </div>
                  </div>
                  <div className="p-4 border-2 border-green-500 rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold flex items-center gap-1.5 text-green-700 dark:text-green-400">
                        <TrendingUp className="w-4 h-4" /> Skor Prioritas Urban
                      </h3>
                      <span className="font-black text-2xl text-green-600 dark:text-green-400">
                        8.5/10
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
                      Prioritas tinggi karena kekhawatiran keselamatan dan
                      dukungan komunitas yang kuat.
                    </p>
                  </div>
                </Card>
                <Card className="p-6 border-green-100">
                  <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
                    Aksi Cepat
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href={`/admin/projects/${project.id}?mode=edit`}>
                      <Button
                        variant="outline"
                        className="w-full h-11 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Edit Proyek
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full h-11 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Lihat Laporan
                    </Button>
                    <Button
                      variant="primary"
                      className="col-span-2 w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={() => setIsStatusModalOpen(true)}
                    >
                      Update Status
                    </Button>
                  </div>
                </Card>
              </>
            )}

            {userRole === "Resident" && (
              <Card className="p-6 border-green-100">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-green-600" /> Voting
                      Komunitas
                    </h2>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      Aktif
                    </Badge>
                  </div>
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => handleVote("agree")}
                      className={cn(
                        "flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 font-bold transition-all",
                        userVote === "agree"
                          ? "bg-green-600 border-green-600 text-white shadow-md"
                          : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
                      )}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      <span className="text-xl">{votes.agree}</span>
                      <span className="text-xs uppercase tracking-wider opacity-75">
                        Setuju
                      </span>
                    </button>
                    <button
                      onClick={() => handleVote("disagree")}
                      className={cn(
                        "flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 font-bold transition-all",
                        userVote === "disagree"
                          ? "bg-red-500 border-red-500 text-white shadow-md"
                          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
                      )}
                    >
                      <ThumbsDown className="w-5 h-5" />
                      <span className="text-xl">{votes.disagree}</span>
                      <span className="text-xs uppercase tracking-wider opacity-75">
                        Tidak
                      </span>
                    </button>
                  </div>
                  {userVote && (
                    <p className="text-xs text-center text-green-600 font-medium">
                      ✅ Vote Anda tercatat. Klik lagi untuk membatalkan.
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 dark:border-slate-700 pt-5">
                  <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-green-600" /> Diskusi
                    Komunitas
                    <span className="text-xs text-gray-500 font-normal bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {comments.length} komentar
                    </span>
                  </h3>
                  <div className="flex gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">
                        {userName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-green-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm resize-none h-20 text-gray-800 dark:text-slate-200 transition-all"
                        placeholder={`Tulis pendapat Anda tentang proyek ini, ${userName}...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey)
                            handlePostComment();
                        }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          Ctrl+Enter untuk kirim
                        </span>
                        <Button
                          variant="primary"
                          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-600 hover:bg-green-700"
                          onClick={handlePostComment}
                          disabled={!newComment.trim() || loading}
                        >
                          <Send className="w-3.5 h-3.5" /> Kirim
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
                            {comment.author.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm text-gray-800 dark:text-slate-200">
                              {comment.author}
                            </p>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                                comment.role === "Admin"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                  : comment.role === "Manager"
                                    ? "bg-blue-100 text-blue-700 border-blue-300"
                                    : "bg-green-100 text-green-700 border-green-300",
                              )}
                            >
                              {comment.role}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-slate-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                            {comment.text}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1 transition-colors font-semibold"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              {commentLikes[comment.id] ?? comment.likes}
                            </button>
                            <button className="text-xs text-gray-500 hover:text-green-600 font-semibold transition-colors">
                              Balas
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card className="p-5 border-2 border-green-500 bg-gradient-to-br from-green-700 to-green-900 text-white">
              <h3 className="text-xs font-bold uppercase tracking-widest text-green-300 mb-1">
                Anggaran Proyek
              </h3>
              <p className="text-3xl font-black mb-4">
                Rp {(project.budget / 1000000).toFixed(1)}M
              </p>
              {project.status === "Funding" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-green-300 mb-1 font-semibold">
                      <span>
                        Terkumpul: Rp{" "}
                        {((project.fundsCollected || 0) / 1000000).toFixed(1)}M
                      </span>
                      <span>
                        {Math.round(
                          ((project.fundsCollected || 0) / project.budget) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-green-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-2.5 rounded-full"
                        style={{
                          width: `${Math.round(((project.fundsCollected || 0) / project.budget) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/app/crowdfunding/${project.id}`}
                    className="block"
                  >
                    <Button className="w-full h-11 font-bold bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-yellow-400 flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4" /> Donasi Sekarang
                    </Button>
                  </Link>
                </div>
              )}
              {project.status !== "Funding" && (
                <div className="px-3 py-2 bg-green-800 rounded-lg text-xs text-green-300 font-medium text-center">
                  {project.status === "Planning"
                    ? "⏳ Pendanaan belum dibuka"
                    : project.status === "Completed"
                      ? "✅ Pendanaan selesai"
                      : "🚧 Sedang konstruksi"}
                </div>
              )}
            </Card>

            <Card className="p-5 border-green-100">
              <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-sm">
                Progress Keseluruhan
              </h3>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-black text-green-600 dark:text-green-400">
                  {project.progress}%
                </span>
                <span className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                  selesai
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    PROGRESS_COLOR[project.status],
                  )}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={project.status}
        projectName={project.name}
        projectId={project.id}
        onUpdateSuccess={(newStatus) =>
          setProject((prev) => ({ ...prev, status: newStatus }))
        }
      />
    </div>
  );
}
