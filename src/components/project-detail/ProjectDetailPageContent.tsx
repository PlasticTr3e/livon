"use client";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Badge, Card, cn } from "@/components/ui/primitives";
import { useUser } from "@/context/UserContext";
import { isApiSuccess } from "@/lib/api-types";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/AppToaster";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const ProjectMiniMap = dynamic(
  () => import("@/components/maps/ProjectMiniMap"),
  {
    ssr: false,
    loading: () => (
      <LoadingState
        label="Loading map..."
        variant="panel"
        className="h-full rounded-2xl"
      />
    ),
  },
);
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageSquare,
  DollarSign,
  TrendingUp,
  FileText,
  UploadCloud,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  Send,
  File,
  Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import {
  getUserAvatarClassName,
  getUserInitial,
  getUserProfileDisplayName,
} from "@/lib/app-shell/user";
import { ProjectImageCarousel } from "./ProjectImageCarousel";
import { ProjectSentimentBar } from "./ProjectSentimentBar";
import { getProjectStage, PROJECT_STAGES } from "@/lib/project-lifecycle";

const UpdateProjectStatusDialog = dynamic(
  () =>
    import("@/components/projects/UpdateProjectStatusDialog").then(
      (module) => module.UpdateProjectStatusDialog,
    ),
  {
    ssr: false,
    loading: () => <ProjectModalLoading label="Loading status dialog..." />,
  },
);

const ProjectImageViewer = dynamic(
  () =>
    import("./ProjectImageViewer").then((module) => module.ProjectImageViewer),
  {
    ssr: false,
    loading: () => <ProjectModalLoading label="Loading image viewer..." />,
  },
);

const ProjectPdfViewer = dynamic(
  () => import("./ProjectPdfViewer").then((module) => module.ProjectPdfViewer),
  {
    ssr: false,
    loading: () => <ProjectModalLoading label="Loading document viewer..." />,
  },
);

// ── Local type definitions (no longer from mockData) ──────────────────────────
interface Comment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
  likes: number;
  sentimentLabel?: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
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
  estimatedDurationDays?: number;
  progress: number;
  priorityScore?: number;
  sentimentScore?: number;
  comments: Comment[];
  documents: ProjectDocument[];
  latitude?: number;
  longitude?: number;
  dateAdded: string;
  imageUrls: string[];
}

interface ApiComment {
  id: string | number;
  text?: string;
  createdAt?: string;
  sentimentLabel?: string;
  sentimentScore?: number;
  user?: {
    email?: string;
    name?: string | null;
    role?: string;
    citizenProfile?: { fullName?: string | null } | null;
    agencyProfile?: { agencyName?: string | null } | null;
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
  estimatedDurationDays?: number | string | null;
  _count?: { votes?: number; comments?: number };
  documentUrl?: string[];
  priorityScore?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  createdAt?: string;
  imageUrls?: string[];
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

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

function computeProgress(
  budget: number,
  fundsCollected?: number,
  status?: string,
) {
  if (status === "Completed") return 100;
  if (!budget || !fundsCollected) return 0;
  return Math.min(Math.round((fundsCollected / budget) * 100), 100);
}

function formatDurationDays(durationDays?: number) {
  if (!durationDays || durationDays < 1) return "Duration TBD";

  if (durationDays >= 30) {
    const months = Math.floor(durationDays / 30);
    return `${months} ${months > 1 ? "Months" : "Month"}`;
  }

  return `${durationDays} ${durationDays > 1 ? "Days" : "Day"}`;
}

function ProjectModalLoading({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <LoadingState
        label={label}
        variant="panel"
        className="min-h-32 w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-[#111827]"
      />
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Planning:
    "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/40",
  "Under Construction":
    "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/40",
  Completed:
    "bg-green-100 text-green-700 border-green-300 dark:bg-green-500/20 dark:text-green-200 dark:border-green-400/40",
};

const CATEGORY_BADGE_STYLE =
  "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

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
  comments: [],
  documents: [],
  dateAdded: "-",
  imageUrls: [],
};

export function ProjectDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const { userRole, userName } = useUser();
  const toast = useToast();
  const [project, setProject] = useState<Project>({
    ...EMPTY_PROJECT,
    id: id as string,
  });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    project.documents,
  );
  const [loading, setLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const projectImages =
    project.imageUrls && project.imageUrls.length > 0
      ? project.imageUrls
      : [
          "https://images.unsplash.com/photo-1541888081186-e8220641151d?w=900&auto=format&fit=crop&q=80",
        ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [projectImages.length]);

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
        if (isApiSuccess(projectResponse) && projectResponse.data) {
          const payload = projectResponse.data;
          const normalizedProject: Project = {
            id: String(payload.id),
            name: String(payload.title || EMPTY_PROJECT.name),
            description: String(payload.description || ""),
            status: getProjectStage(String(payload.status)),
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
            estimatedDurationDays: payload.estimatedDurationDays
              ? Number(payload.estimatedDurationDays)
              : undefined,
            progress: computeProgress(
              payload.budgetTarget ? Number(payload.budgetTarget) : 0,
              payload.currentFunding ? Number(payload.currentFunding) : 0,
              getProjectStage(String(payload.status)),
            ),
            priorityScore: payload.priorityScore
              ? Number(payload.priorityScore)
              : 0,
            comments: [],
            documents: payload.documentUrl
              ? payload.documentUrl.map((url, i) => {
                  const parts = url.split("/");
                  const filename = parts[parts.length - 1];
                  const ext =
                    filename.split(".").pop()?.toUpperCase() || "FILE";
                  return {
                    id: `doc-${i}`,
                    name: decodeURIComponent(filename),
                    type: ext,
                    size: "Cloud File",
                    uploadedAt: "-",
                    uploadedBy: "Sistem",
                    url: url,
                  };
                })
              : [],
            latitude: payload.latitude ? Number(payload.latitude) : undefined,
            longitude: payload.longitude
              ? Number(payload.longitude)
              : undefined,
            dateAdded: formatDate(payload.createdAt as string),
            imageUrls: payload.imageUrls || [],
          };

          setProject(normalizedProject);
          setDocuments(normalizedProject.documents);
        }

        const commentsResponse = await apiFetch<ApiComment[]>(
          `/api/comments?projectId=${id}`,
          { headers },
        );

        if (isApiSuccess(commentsResponse) && commentsResponse.data) {
          const commentsData = commentsResponse.data;
          const loadedComments: Comment[] = commentsData.map(
            (comment: ApiComment) => ({
              id: String(comment.id),
              author: getUserProfileDisplayName(comment.user, "Anonymous"),
              role: String(comment.user?.role || "resident"),
              text: String(comment.text || ""),
              timestamp: formatDate(comment.createdAt as string),
              likes: 0,
              sentimentLabel: comment.sentimentLabel,
            }),
          );
          setComments(loadedComments);
        }
      } catch (error) {
        console.error("Failed to load project data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [id, userRole]);

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

    if (isApiSuccess(response) && response.data) {
      const comment = response.data;

      const newCommentItem: Comment = {
        id: String(comment.id),
        author: getUserProfileDisplayName(
          comment.user,
          userName || "Anonymous",
        ),
        role: comment.user?.role || userRole || "resident",
        text: String(comment.text || newComment.trim()),
        timestamp: formatDate(comment.createdAt),
        likes: 0,
        sentimentLabel: comment.sentimentLabel,
      };

      setComments((prev) => [newCommentItem, ...prev]);
      setNewComment("");
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timelineStages = [...PROJECT_STAGES];
  const currentStageIndex = timelineStages.indexOf(
    getProjectStage(project.status),
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const token = localStorage.getItem("livon-token");
    if (!token) {
      toast.error("Login required", "Please log in to upload documents.");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload files
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload gagal");
        const json = await res.json();
        return json.data.url;
      });

      const newUrls = await Promise.all(uploadPromises);

      // 2. Map existing documents to URLs
      const existingUrls = documents
        .map((d) => d.url)
        .filter(Boolean) as string[];
      const updatedUrls = [...existingUrls, ...newUrls];

      // 3. Save to database
      const patchRes = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentUrl: updatedUrls }),
      });

      if (!patchRes.ok) throw new Error("Failed to save document.");

      // 4. Update UI state
      const newDocs: ProjectDocument[] = newUrls.map((url, i) => {
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        const ext = filename.split(".").pop()?.toUpperCase() || "FILE";
        return {
          id: `doc-new-${Date.now()}-${i}`,
          name: decodeURIComponent(filename),
          type: ext,
          size: "Cloud File",
          uploadedAt: new Date().toISOString().split("T")[0],
          uploadedBy: userName,
          url: url,
        };
      });

      setDocuments((prev) => [...prev, ...newDocs]);
      toast.success("Success", "Document uploaded.");
    } catch (err) {
      console.error(err);
      toast.error(
        "Upload failed",
        "An error occurred while uploading the document.",
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto">
      <div className="sticky top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link
          href={fromAdmin ? "/admin/projects" : "/map"}
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">
            {fromAdmin ? "Back to Menu" : "Back to Map"}
          </span>
        </Link>
      </div>

      <div className="max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("py-1 px-3", STATUS_STYLES[project.status])}>
              {project.status}
            </Badge>
            <Badge className={cn("py-1 px-3", CATEGORY_BADGE_STYLE)}>
              {project.category}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-white">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-green-600" />
              {project.latitude && project.longitude
                ? `${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}`
                : project.address}
            </span>
            {["Under Construction", "Completed"].includes(project.status) && (
              <span className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-700 dark:text-white">
                  {formatDurationDays(project.estimatedDurationDays)}
                </span>
              </span>
            )}
          </div>
        </div>

        <ProjectImageCarousel
          images={projectImages}
          imageIndex={currentImageIndex}
          projectName={project.name}
          onOpenViewer={() => setIsImageViewerOpen(true)}
          onPrevious={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? projectImages.length - 1 : prev - 1,
            )
          }
          onNext={() =>
            setCurrentImageIndex((prev) => (prev + 1) % projectImages.length)
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-green-100">
              <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3 text-lg tracking-tight">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                Project Description
              </h2>
              <p className="text-gray-700 dark:text-white leading-relaxed">
                {project.description}
              </p>
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5 text-sm tracking-tight">
                  <Clock className="w-4 h-4 text-green-600" /> Development
                  Stages
                </h3>
                <div className="relative pb-2">
                  <div className="absolute top-3 left-[16.666%] right-[16.666%] h-1 bg-gray-200 dark:bg-slate-700 -z-0">
                    <div
                      className={cn("h-full transition-all", "bg-green-600")}
                      style={{
                        width: `${(currentStageIndex / (timelineStages.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="relative flex justify-between z-10">
                    {timelineStages.map((stage, idx) => {
                      const isActive = idx === currentStageIndex;
                      const isPast = idx < currentStageIndex;

                      const stageBgColor = "bg-green-600";
                      const stageBorderColor = "border-green-600";
                      const stageRingColor = "ring-green-100";
                      const stageTextColor =
                        "text-green-700 dark:text-green-400";

                      return (
                        <div
                          key={stage}
                          className="flex flex-col items-center flex-1 text-center"
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border-4 z-10 transition-all mx-auto",
                              isPast
                                ? `${stageBgColor} ${stageBorderColor}`
                                : isActive
                                  ? `bg-white ${stageBorderColor} ring-4 ${stageRingColor}`
                                  : "bg-white border-gray-300 dark:border-slate-600",
                            )}
                          >
                            {isPast && (
                              <CheckCircle2 className="w-full h-full text-white p-0.5" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "mt-2 text-[10px] font-bold uppercase tracking-wider block",
                              isPast || isActive
                                ? stageTextColor
                                : "text-gray-400 dark:text-white",
                            )}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {userRole === "agency" && (
              <ProjectSentimentBar feedback={comments} />
            )}

            {(userRole === "resident" || userRole === "agency") && (
              <Card className="p-6 border-green-100">
                <div id="comments">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center justify-between gap-3 mb-4 text-lg tracking-tight">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <MessageSquare className="w-5 h-5 shrink-0 text-green-600" />{" "}
                      <span className="min-w-0 whitespace-nowrap">
                        Community Discussion
                      </span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[10px] text-gray-500 font-normal bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full sm:px-2 sm:text-xs">
                      {comments.length} comments
                    </span>
                  </h3>
                  <div className="flex gap-3 mb-5">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                        getUserAvatarClassName(userRole),
                      )}
                    >
                      <span className="text-white text-sm font-bold">
                        {getUserInitial(userName)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-green-50 dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-xs resize-none h-20 text-gray-800 dark:text-white transition-all sm:text-sm"
                        placeholder={`Share your thoughts about this project, ${userName}...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.ctrlKey)
                            handlePostComment();
                        }}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[11px] text-gray-400 sm:text-xs">
                          Ctrl+Enter to send
                        </span>
                        <Button
                          variant="primary"
                          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-600 hover:bg-green-700 sm:text-sm sm:px-4"
                          onClick={handlePostComment}
                          disabled={!newComment.trim() || loading}
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-gray-600 dark:text-white">
                            {comment.author.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex min-w-0 items-center gap-1.5 mb-1 sm:gap-2">
                            <p className="truncate font-bold text-xs text-gray-800 dark:text-white sm:text-sm">
                              {comment.author}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium border sm:text-[10px]",
                                comment.role?.toLowerCase() === "admin" ||
                                  comment.role?.toLowerCase() === "agency"
                                  ? "bg-blue-100 text-blue-700 border-blue-300"
                                  : comment.role?.toLowerCase() === "developer"
                                    ? "bg-purple-100 text-purple-700 border-purple-300"
                                    : "bg-green-100 text-green-700 border-green-300",
                              )}
                            >
                              {comment.role?.toUpperCase() === "ADMIN" ||
                              comment.role?.toUpperCase() === "AGENCY"
                                ? "Admin"
                                : comment.role?.toUpperCase() === "DEVELOPER"
                                  ? "Developer"
                                  : "Resident"}
                            </span>
                            <span className="shrink-0 text-[10px] text-gray-400 dark:text-white sm:text-xs">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-white leading-relaxed sm:text-sm">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card className="p-6 border-slate-100 shadow-sm bg-white dark:bg-[#111827] rounded-2xl">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2.5 text-sm tracking-tight">
                <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                Estimated Duration
              </h2>
              <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-green-900/40 dark:bg-green-900/10">
                <p className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {formatDurationDays(project.estimatedDurationDays)}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-300">
                  {["Under Construction", "Completed"].includes(project.status)
                    ? "Timeline estimate for the current project work."
                    : "Available once the project enters construction."}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-green-600 text-white shadow-lg rounded-2xl dark:bg-green-600">
              <div className="relative z-10">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2.5 text-sm tracking-tight">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-100" />
                  </div>
                  Project Budget
                </h3>
                <p className="text-2xl md:text-3xl font-bold mb-5 tracking-tight">
                  {formatRupiah(project.budget)}
                </p>
              </div>
            </Card>

            <Card className="h-48 p-0 border-slate-100 shadow-sm bg-white dark:bg-[#111827] rounded-3xl overflow-hidden group relative">
              <ProjectMiniMap
                lat={project.latitude}
                lng={project.longitude}
                status={project.status}
              />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm pointer-events-none">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm tracking-tight">
                  <span className="w-7 h-7 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-green-600" />
                  </span>
                  Project Location
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none group-hover:from-black/10 transition-all" />
            </Card>

            {/* Quick Actions Moved to Sidebar */}
            {userRole === "agency" && (
              <Card className="p-8 border-slate-100 shadow-sm bg-white dark:bg-[#111827] rounded-[2rem]">
                <h2 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2.5 text-sm tracking-tight">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  Quick Actions
                </h2>
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/admin/projects/${project.id}?mode=edit`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full h-13 border-slate-100 bg-slate-50/50 dark:bg-[#1F2937]/50 text-slate-600 dark:text-white hover:bg-white dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2.5 text-green-600" />{" "}
                      Edit Details
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    className="w-full h-14 bg-slate-900 dark:bg-green-600 hover:bg-black dark:hover:bg-green-700 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-slate-200 dark:shadow-green-900/20 transition-all active:scale-[0.98]"
                    onClick={() => setIsStatusModalOpen(true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-3" /> Update Status
                  </Button>
                </div>
              </Card>
            )}

            {/* Project Documents Section - Moved to Sidebar */}
            <Card className="p-6 border-green-100 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5 text-sm tracking-tight">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  Documents
                  <span className="text-[10px] text-gray-500 font-black bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {documents.length}
                  </span>
                </h2>
                {userRole === "agency" && (
                  <Button
                    variant="outline"
                    className="h-8 text-[10px] flex items-center gap-1.5 font-black uppercase tracking-widest px-3 border-green-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Upload
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

              {documents.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-[#1F2937]/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    No Documents
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between group hover:border-green-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-lg shrink-0">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-white truncate group-hover:text-green-700 transition-colors">
                            {doc.name}
                          </p>
                          <p className="text-[9px] font-black text-gray-400 dark:text-white uppercase tracking-tighter mt-0.5">
                            {doc.type} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.type === "PDF" && (
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Lihat PDF"
                            onClick={() => setPdfViewerUrl(doc.url || null)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={doc.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {userRole === "agency" && (
                          <button
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            onClick={async () => {
                              try {
                                const newDocs = documents.filter(
                                  (d) => d.id !== doc.id,
                                );
                                const updatedUrls = newDocs
                                  .map((d) => d.url)
                                  .filter(Boolean) as string[];

                                const token =
                                  localStorage.getItem("livon-token");
                                const patchRes = await fetch(
                                  `/api/projects/${id}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      documentUrl: updatedUrls,
                                    }),
                                  },
                                );

                                if (!patchRes.ok)
                                  throw new Error("Failed to delete document.");
                                setDocuments(newDocs);
                                toast.success("Success", "Document deleted.");
                              } catch (err) {
                                console.error(err);
                                toast.error(
                                  "Delete failed",
                                  "An error occurred while deleting the document.",
                                );
                              }
                            }}
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
          </div>
        </div>
      </div>

      <UpdateProjectStatusDialog
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentStatus={project.status}
        projectName={project.name}
        projectId={project.id}
        onUpdateSuccess={(newStatus, estimatedDurationDays) =>
          setProject((prev) => ({
            ...prev,
            status: newStatus,
            estimatedDurationDays:
              estimatedDurationDays ?? prev.estimatedDurationDays,
          }))
        }
      />

      {isImageViewerOpen && (
        <ProjectImageViewer
          images={projectImages}
          imageIndex={currentImageIndex}
          projectName={project.name}
          onClose={() => setIsImageViewerOpen(false)}
          onPrevious={() =>
            setCurrentImageIndex((prev) =>
              prev === 0 ? projectImages.length - 1 : prev - 1,
            )
          }
          onNext={() =>
            setCurrentImageIndex((prev) => (prev + 1) % projectImages.length)
          }
          onSelectImage={setCurrentImageIndex}
        />
      )}

      {pdfViewerUrl && (
        <ProjectPdfViewer
          url={pdfViewerUrl}
          onClose={() => setPdfViewerUrl(null)}
        />
      )}
    </div>
  );
}
