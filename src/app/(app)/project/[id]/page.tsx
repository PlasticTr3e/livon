"use client";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Badge, Card, cn } from "@/components/ui/primitives";
import { useUser } from "@/context/UserContext";
import { isApiSuccess } from "@/lib/api-types";
import { UpdateProjectStatusDialog } from "@/components/projects/UpdateProjectStatusDialog";
import { Suspense, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const ProjectMiniMap = dynamic(
  () => import("@/components/maps/ProjectMiniMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
        <MapPin className="w-6 h-6 text-slate-300" />
      </div>
    ),
  },
);
import {
  ArrowLeft,
  MapPin,
  Clock,
  BarChart2,
  ThumbsUp,
  ThumbsDown,
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Zap,
  Eye,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

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
  progress: number;
  priorityScore?: number;
  sentimentScore?: number;
  votes: { agree: number; disagree: number };
  comments: Comment[];
  documents: ProjectDocument[];
  latitude?: number;
  longitude?: number;
  dateAdded: string;
  imageUrls: string[];
  sentimentAnalytics?: {
    positive: number;
    negative: number;
    neutral: number;
    averageScore: number;
  };
}

interface ApiComment {
  id: string | number;
  text?: string;
  createdAt?: string;
  sentimentLabel?: string;
  sentimentScore?: number;
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
  _count?: { votes?: number; comments?: number };
  documentUrl?: string[];
  priorityScore?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  createdAt?: string;
  imageUrls?: string[];
}

type VoteChoice = "agree" | "disagree";
type VoteAction = "CREATED" | "UPDATED" | "DELETED";

interface ActivityFeedItem {
  type?: string;
  action?: string;
  targetId?: string | null;
}

type AiSentimentLabel = "POSITIF" | "NEGATIF" | "NETRAL";
type AiInsightSource = "AI" | "Fallback";

interface AiSentimentResult {
  sentiment: AiSentimentLabel;
  confidence_score: number;
  source: AiInsightSource;
}

interface AiProjectMetrics {
  source: AiInsightSource;
  responseRate: number;
  responseLevel: "High" | "Moderate" | "Low";
  responseNarrative: string;
  priorityScore: number;
  priorityNarrative: string;
  insightText: string;
  recommendation: string;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function analyzeCommentLocally(text: string): AiSentimentResult {
  const lowerText = text.toLowerCase();
  const positiveWords = [
    "bagus",
    "setuju",
    "mendukung",
    "mantap",
    "bermanfaat",
    "terima kasih",
    "cepat",
    "solusi",
  ];
  const negativeWords = [
    "rusak",
    "lambat",
    "macet",
    "bahaya",
    "kecewa",
    "parah",
    "mahal",
    "telat",
  ];

  const positiveCount = positiveWords.filter((word) =>
    lowerText.includes(word),
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    lowerText.includes(word),
  ).length;

  if (positiveCount > negativeCount) {
    return { sentiment: "POSITIF", confidence_score: 0.62, source: "Fallback" };
  }

  if (negativeCount > positiveCount) {
    return { sentiment: "NEGATIF", confidence_score: 0.62, source: "Fallback" };
  }

  return { sentiment: "NETRAL", confidence_score: 0.5, source: "Fallback" };
}

async function predictCommentSentiment(
  text: string,
): Promise<AiSentimentResult> {
  const aiUrl =
    process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
  const aiKey = process.env.NEXT_PUBLIC_AI_SERVICE_API_KEY || "";

  try {
    const response = await fetch(`${aiUrl}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error("AI service error");

    const json = await response.json();
    const sentiment = json?.data?.sentiment as AiSentimentLabel | undefined;
    const confidenceScore = Number(json?.data?.confidence_score);

    if (!sentiment || !Number.isFinite(confidenceScore)) {
      throw new Error("Invalid AI response");
    }

    return {
      sentiment,
      confidence_score: clamp(confidenceScore, 0, 1),
      source: "AI",
    };
  } catch (error) {
    console.warn("AI project metric fallback used:", error);
    return analyzeCommentLocally(text);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Planning: "bg-blue-100 text-blue-700 border-blue-300",
  Funding: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Construction: "bg-orange-100 text-orange-700 border-orange-300",
  Completed: "bg-green-100 text-green-700 border-green-300",
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
  dateAdded: "-",
  imageUrls: [],
};

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const { userRole, userName } = useUser();
  const [project, setProject] = useState<Project>({
    ...EMPTY_PROJECT,
    id: id as string,
  });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [votes, setVotes] = useState({
    agree: 0,
    disagree: 0,
  });
  const [userVote, setUserVote] = useState<"agree" | "disagree" | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    project.documents,
  );
  const [loading, setLoading] = useState(true);
  const [aiMetrics, setAiMetrics] = useState<AiProjectMetrics | null>(null);
  const [isAiMetricsLoading, setIsAiMetricsLoading] = useState(false);

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
            priorityScore: payload.priorityScore
              ? Number(payload.priorityScore)
              : 0,
            votes: {
              agree: Number(payload._count?.votes ?? 0),
              disagree: 0,
            },
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
          setVotes(normalizedProject.votes);
        }

        if (token && userRole === "resident") {
          try {
            const activityRes = await fetch("/api/users/activity?limit=1000", {
              headers,
            });
            const activityJson = await activityRes.json();
            const activityItems: ActivityFeedItem[] = Array.isArray(
              activityJson.data?.data,
            )
              ? activityJson.data.data
              : Array.isArray(activityJson.data)
                ? activityJson.data
                : [];
            const currentVote = activityItems.find(
              (item) => item.type === "VOTE" && item.targetId === String(id),
            );

            if (currentVote?.action?.toLowerCase().startsWith("upvoted")) {
              setUserVote("agree");
            } else if (
              currentVote?.action?.toLowerCase().startsWith("downvoted")
            ) {
              setUserVote("disagree");
            } else {
              setUserVote(null);
            }
          } catch (e) {
            console.error("Failed to load current user vote", e);
          }
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
              author: String(comment.user?.email || "Anonymous"),
              role: String(comment.user?.role || "resident"),
              text: String(comment.text || ""),
              timestamp: formatDate(comment.createdAt as string),
              likes: 0,
            }),
          );
          setComments(loadedComments);

          // Calculate dynamic sentiment from comments
          if (commentsData.length > 0) {
            let pos = 0,
              neg = 0,
              neu = 0,
              totalScore = 0;
            commentsData.forEach((c: ApiComment) => {
              if (c.sentimentLabel === "POSITIF") pos++;
              else if (c.sentimentLabel === "NEGATIF") neg++;
              else neu++;
              totalScore += c.sentimentScore || 0;
            });

            setProject((prev) => ({
              ...prev,
              sentimentAnalytics: {
                positive: pos,
                negative: neg,
                neutral: neu,
                averageScore: totalScore / (commentsData.length || 1),
              },
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load project data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjectData();
  }, [id, userRole]);

  useEffect(() => {
    let isMounted = true;

    async function buildAiMetrics() {
      if (!project.id) return;

      setIsAiMetricsLoading(true);
      try {
        const totalVoteCount = votes.agree + votes.disagree;
        const agreeRate = totalVoteCount > 0 ? votes.agree / totalVoteCount : 0;

        const sentimentResults =
          comments.length > 0
            ? await Promise.all(
                comments.map((comment) =>
                  predictCommentSentiment(comment.text),
                ),
              )
            : [];

        if (!isMounted) return;

        const totalAnalyzed = sentimentResults.length;
        const positiveCount = sentimentResults.filter(
          (item) => item.sentiment === "POSITIF",
        ).length;
        const negativeCount = sentimentResults.filter(
          (item) => item.sentiment === "NEGATIF",
        ).length;
        const aiSource: AiInsightSource = sentimentResults.some(
          (item) => item.source === "AI",
        )
          ? "AI"
          : "Fallback";
        const averageConfidence =
          totalAnalyzed > 0
            ? sentimentResults.reduce(
                (sum, item) => sum + item.confidence_score,
                0,
              ) / totalAnalyzed
            : 0;
        const positiveRate =
          totalAnalyzed > 0 ? positiveCount / totalAnalyzed : 0;
        const negativeRate =
          totalAnalyzed > 0 ? negativeCount / totalAnalyzed : 0;
        const sentimentScore =
          totalAnalyzed > 0
            ? sentimentResults.reduce((sum, item) => {
                const value =
                  item.sentiment === "POSITIF"
                    ? 1
                    : item.sentiment === "NEGATIF"
                      ? -1
                      : 0;
                return sum + value * item.confidence_score;
              }, 0) / totalAnalyzed
            : 0;

        const responseRate = Math.round(
          clamp(
            Math.min(42, comments.length * 7) +
              Math.min(28, totalVoteCount * 3) +
              averageConfidence * 18 +
              positiveRate * 10 -
              negativeRate * 8,
            0,
            98,
          ),
        );
        const responseLevel =
          responseRate >= 75 ? "High" : responseRate >= 40 ? "Moderate" : "Low";
        const participationScore = clamp(
          comments.length * 1.1 + totalVoteCount * 0.45,
          0,
          10,
        );
        const concernScore = clamp(
          negativeRate * averageConfidence * 10,
          0,
          10,
        );
        const supportScore = clamp(agreeRate * 10 + positiveRate * 2, 0, 10);
        const statusUrgency =
          project.status === "Planning"
            ? 7
            : project.status === "Funding"
              ? 6
              : project.status === "Construction"
                ? 4
                : 1;
        const storedPriority = project.priorityScore || 0;
        const priorityScore = Number(
          clamp(
            (storedPriority > 0 ? storedPriority * 0.35 : 2) +
              participationScore * 0.22 +
              concernScore * 0.26 +
              supportScore * 0.12 +
              statusUrgency * 0.05,
            0,
            10,
          ).toFixed(1),
        );

        const responseNarrative =
          comments.length === 0
            ? "AI belum punya cukup komentar untuk membaca pola respons warga."
            : responseLevel === "High"
              ? `AI membaca respons warga tinggi dari ${comments.length} komentar dan ${totalVoteCount} vote.`
              : responseLevel === "Moderate"
                ? "AI melihat respons warga mulai terbentuk, namun sampel diskusi masih perlu dipantau."
                : "AI menilai respons warga masih rendah karena volume komentar dan vote terbatas.";
        const priorityNarrative =
          priorityScore >= 8
            ? "AI menandai proyek ini sebagai prioritas tinggi karena partisipasi dan sinyal urgensi warga cukup kuat."
            : priorityScore >= 5
              ? "AI menilai prioritas proyek berada di level menengah dan perlu terus dipantau seiring bertambahnya respons warga."
              : "AI menilai prioritas proyek masih rendah dibanding proyek dengan tekanan partisipasi atau keluhan yang lebih tinggi.";
        const insightText =
          comments.length === 0
            ? "Belum ada komentar yang bisa dianalisis. AI akan memperbarui insight setelah warga mulai berdiskusi."
            : sentimentScore > 0.25
              ? `Berdasarkan analisis AI terhadap ${comments.length} komentar, sentimen warga cenderung positif dengan dukungan voting ${Math.round(agreeRate * 100)}%.`
              : sentimentScore < -0.15
                ? `AI mendeteksi kekhawatiran warga pada diskusi proyek ini. Sentimen negatif muncul pada ${Math.round(negativeRate * 100)}% komentar yang dianalisis.`
                : `AI membaca respons warga masih campuran. Diskusi perlu dipantau karena pola dukungan dan kekhawatiran belum dominan.`;
        const recommendation =
          negativeRate >= 0.35
            ? "Prioritaskan klarifikasi publik, jawab kekhawatiran utama warga, dan tampilkan update progres yang mudah diverifikasi."
            : priorityScore >= 8
              ? "Naikkan proyek ini ke daftar pemantauan prioritas dan siapkan komunikasi rutin agar momentum dukungan warga tetap terjaga."
              : responseRate < 40
                ? "Dorong partisipasi warga dengan update ringkas, ajakan feedback, dan publikasi milestone proyek berikutnya."
                : project.category === "Infrastruktur" ||
                    project.category === "Jalan"
                  ? "Optimalkan jadwal pengerjaan dan komunikasikan dampak lalu lintas agar dukungan warga tetap stabil."
                  : "Lanjutkan pemantauan berkala dan gunakan insight AI ini untuk menentukan kapan perlu klarifikasi atau eskalasi.";

        setAiMetrics({
          source: aiSource,
          responseRate,
          responseLevel,
          responseNarrative,
          priorityScore,
          priorityNarrative,
          insightText,
          recommendation,
        });
      } finally {
        if (isMounted) setIsAiMetricsLoading(false);
      }
    }

    buildAiMetrics();

    return () => {
      isMounted = false;
    };
  }, [
    comments,
    project.category,
    project.id,
    project.priorityScore,
    project.status,
    votes.agree,
    votes.disagree,
  ]);

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
        author: comment.user?.email || userName || "Anonymous",
        role: comment.user?.role || userRole || "resident",
        text: String(comment.text || newComment.trim()),
        timestamp: formatDate(comment.createdAt),
        likes: 0,
      };

      setComments((prev) => [newCommentItem, ...prev]);
      setNewComment("");
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timelineStages = ["Planning", "Funding", "Construction", "Completed"];
  const currentStageIndex = timelineStages.indexOf(project.status);

  const getOppositeVote = (voteType: VoteChoice): VoteChoice =>
    voteType === "agree" ? "disagree" : "agree";

  const getVoteDelta = (
    action: VoteAction,
    voteType: VoteChoice,
    currentVote: VoteChoice | null,
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

  const handleVote = async (type: VoteChoice) => {
    if (isSavingVote) return;

    const token = localStorage.getItem("livon-token");
    if (!token) {
      alert("Silakan login untuk memberikan vote.");
      return;
    }

    setIsSavingVote(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: id,
          type: type === "agree" ? "UPVOTE" : "DOWNVOTE",
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
            : userVote === type
              ? "DELETED"
              : userVote
                ? "UPDATED"
                : "CREATED"
      ) as VoteAction;
      const { nextVote, agreeDelta, disagreeDelta } = getVoteDelta(
        action,
        type,
        userVote,
      );

      setVotes((prev) => ({
        agree: Math.max(0, prev.agree + agreeDelta),
        disagree: Math.max(0, prev.disagree + disagreeDelta),
      }));
      setUserVote(nextVote);
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan vote, silakan coba lagi.");
    } finally {
      setIsSavingVote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const token = localStorage.getItem("livon-token");
    if (!token) {
      alert("Silakan login untuk mengunggah dokumen.");
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

      if (!patchRes.ok) throw new Error("Gagal menyimpan dokumen ke database");

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
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah dokumen.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const totalVotes = votes.agree + votes.disagree;
  const agreePercent =
    totalVotes > 0 ? Math.round((votes.agree / totalVotes) * 100) : 0;
  const displayedResponseRate = aiMetrics?.responseRate ?? 0;
  const displayedResponseLevel = aiMetrics?.responseLevel ?? "Low";
  const displayedPriorityScore =
    aiMetrics?.priorityScore ?? project.priorityScore ?? 0;
  const aiSourceLabel = aiMetrics?.source === "AI" ? "AI Live" : "Local AI";

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
            <Badge className="py-1 px-3 bg-white border-gray-200 text-gray-600">
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
            {project.status === "Construction" && (
              <span className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-700 dark:text-white">
                  {project.startDate && project.endDate
                    ? (() => {
                        const start = new Date(project.startDate);
                        const end = new Date(project.endDate);
                        const diffTime = Math.abs(
                          end.getTime() - start.getTime(),
                        );
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        if (diffDays >= 30) {
                          const months = Math.floor(diffDays / 30);
                          return `${months} ${months > 1 ? "Months" : "Month"}`;
                        }
                        return `${diffDays} ${diffDays > 1 ? "Days" : "Day"}`;
                      })()
                    : "Duration TBD"}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-green-100 shadow-sm bg-black relative group">
          <div
            className="flex w-full h-full transition-transform duration-500 ease-in-out cursor-pointer"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            onClick={() => setIsImageViewerOpen(true)}
          >
            {projectImages.map((src, idx) => (
              <div key={idx} className="min-w-full h-full relative">
                <ImageWithFallback
                  src={src}
                  alt={`${project.name} - Image ${idx + 1}`}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/50 p-3 rounded-full text-white backdrop-blur-sm">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
            {projectImages.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  idx === currentImageIndex ? "bg-white w-6" : "bg-white/50",
                )}
              />
            ))}
          </div>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) =>
                prev === 0 ? projectImages.length - 1 : prev - 1,
              );
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev + 1) % projectImages.length);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-green-100">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" /> Project
                Description
              </h2>
              <p className="text-gray-700 dark:text-white leading-relaxed">
                {project.description}
              </p>
              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" /> Development
                  Stages
                </h3>
                <div className="relative pb-2">
                  <div className="absolute top-3 left-[12.5%] right-[12.5%] h-1 bg-gray-200 dark:bg-slate-700 -z-0">
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
              <div className="space-y-6">
                <Card className="p-8 border-slate-100 shadow-sm bg-white dark:bg-[#111827] overflow-hidden relative">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3 text-lg tracking-tight">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-green-600" />
                    </div>
                    Project Analytics
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                    <div className="relative group">
                      <p className="text-[10px] text-slate-400 mb-2.5 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        <ThumbsUp className="w-3 h-3" /> Public Participation
                      </p>
                      <div className="flex items-baseline gap-2.5">
                        <p className="font-black text-4xl text-slate-900 dark:text-white">
                          {votes.agree + votes.disagree}
                        </p>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          Total Votes
                        </span>
                      </div>
                      <div className="mt-5 space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-green-600">Agree</span>
                          <span className="text-red-400">Disagree</span>
                        </div>
                        <div className="flex h-1.5 w-full bg-slate-100 dark:bg-[#1F2937] rounded-full overflow-hidden flex shadow-inner">
                          <div
                            className="bg-green-500 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${agreePercent}%` }}
                          />
                          <div
                            className="bg-red-400 h-full transition-all duration-1000 ease-out"
                            style={{ width: `${100 - agreePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <p className="text-[10px] text-slate-400 mb-2.5 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Response Rate
                      </p>
                      <div className="flex items-baseline gap-3">
                        <p className="font-black text-4xl text-slate-900 dark:text-white">
                          {isAiMetricsLoading
                            ? "..."
                            : `${displayedResponseRate}%`}
                        </p>
                        <div
                          className={cn(
                            "px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-tighter border",
                            displayedResponseLevel === "High"
                              ? "bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800"
                              : displayedResponseLevel === "Moderate"
                                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border-yellow-100 dark:border-yellow-800"
                                : "bg-slate-50 dark:bg-[#111827]/20 text-slate-400 border-slate-100 dark:border-gray-800",
                          )}
                        >
                          {displayedResponseLevel}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-medium italic">
                        {aiMetrics?.responseNarrative ||
                          "AI sedang membaca pola respons warga dari komentar dan vote."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-50 dark:border-gray-800">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                          Sentiment Analysis
                        </h3>
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5",
                            (project.sentimentAnalytics?.averageScore || 0) >
                              0.4
                              ? "bg-green-50 text-green-700 border-green-100"
                              : (project.sentimentAnalytics?.averageScore ||
                                    0) < -0.4
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-gray-50 text-gray-700 border-gray-100",
                          )}
                        >
                          {(project.sentimentAnalytics?.averageScore || 0) > 0.4
                            ? "Highly Positive"
                            : (project.sentimentAnalytics?.averageScore || 0) <
                                -0.4
                              ? "Mainly Negative"
                              : "Neutral / Mixed"}
                        </Badge>
                      </div>
                      <div className="p-5 bg-slate-50/50 dark:bg-[#1F2937]/20 rounded-2xl border border-slate-50 dark:border-gray-800 shadow-inner">
                        <div className="flex h-2.5 w-full rounded-full overflow-hidden mb-4 bg-slate-100 dark:bg-[#1F2937]">
                          {project.sentimentAnalytics ? (
                            <>
                              <div
                                className="bg-green-500 h-full transition-all duration-1000"
                                style={{
                                  width: `${Math.round((project.sentimentAnalytics.positive / (project.sentimentAnalytics.positive + project.sentimentAnalytics.negative + project.sentimentAnalytics.neutral || 1)) * 100)}%`,
                                }}
                              />
                              <div
                                className="bg-slate-300 dark:bg-slate-600 h-full opacity-40"
                                style={{
                                  width: `${Math.round((project.sentimentAnalytics.neutral / (project.sentimentAnalytics.positive + project.sentimentAnalytics.negative + project.sentimentAnalytics.neutral || 1)) * 100)}%`,
                                }}
                              />
                              <div
                                className="bg-red-400 h-full"
                                style={{
                                  width: `${Math.round((project.sentimentAnalytics.negative / (project.sentimentAnalytics.positive + project.sentimentAnalytics.negative + project.sentimentAnalytics.neutral || 1)) * 100)}%`,
                                }}
                              />
                            </>
                          ) : (
                            <div className="bg-slate-200 w-full h-full animate-pulse" />
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
                            Positive (
                            {project.sentimentAnalytics
                              ? Math.round(
                                  (project.sentimentAnalytics.positive /
                                    (project.sentimentAnalytics.positive +
                                      project.sentimentAnalytics.negative +
                                      project.sentimentAnalytics.neutral ||
                                      1)) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                          <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />{" "}
                            Neutral (
                            {project.sentimentAnalytics
                              ? Math.round(
                                  (project.sentimentAnalytics.neutral /
                                    (project.sentimentAnalytics.positive +
                                      project.sentimentAnalytics.negative +
                                      project.sentimentAnalytics.neutral ||
                                      1)) *
                                    100,
                                )
                              : 0}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 dark:bg-[#1F2937]/20 border border-slate-50 dark:border-gray-800 relative group transition-all hover:bg-white dark:hover:bg-slate-800/50 hover:shadow-xl hover:shadow-green-500/5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em] mb-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-green-500" />{" "}
                            Urban Priority Score
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-4xl text-green-600 dark:text-green-400 tabular-nums">
                            {isAiMetricsLoading
                              ? "..."
                              : displayedPriorityScore.toFixed(1)}
                          </span>
                          <span className="text-[10px] font-black text-slate-300 ml-1 uppercase">
                            / 10
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 p-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[11px] text-slate-600 dark:text-white font-medium leading-relaxed italic">
                          &quot;
                          {aiMetrics?.priorityNarrative ||
                            "AI sedang menghitung prioritas dari komentar, vote, sentimen, dan status proyek."}
                          &quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* AI Recommendation Section - Styled like Comments Admin */}
                <Card className="p-0 border-purple-100 shadow-sm bg-white dark:bg-[#111827] relative overflow-hidden group rounded-3xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5" />

                  <div className="relative p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-400 blur-md opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                          <Sparkles className="w-6 h-6" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none">
                            AI Insight
                          </h2>
                          <span className="text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-purple-200/50">
                            Beta
                          </span>
                          <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-200/50">
                            {aiSourceLabel}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 mt-1.5">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-600 dark:text-purple-400 leading-none">
                            Livon Intelligent Analysis AI
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/50 dark:bg-[#111827]/50 backdrop-blur-md rounded-2xl p-6 border border-purple-100 dark:border-purple-900/30 relative shadow-sm">
                      <div className="space-y-5">
                        <div className="flex gap-4">
                          <div className="w-1 rounded-full bg-gradient-to-b from-purple-400 to-transparent opacity-20" />
                          <p className="text-sm text-slate-600 dark:text-white font-medium italic leading-relaxed">
                            {isAiMetricsLoading
                              ? "AI sedang menganalisis komentar warga, pola voting, dan status proyek untuk membuat insight terbaru."
                              : aiMetrics?.insightText ||
                                "Belum ada cukup data untuk membuat insight AI yang kuat."}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-purple-50 dark:border-purple-900/20">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg shrink-0">
                              <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Recommendation
                              </p>
                              <p className="text-sm text-slate-900 dark:text-white font-bold leading-relaxed">
                                {isAiMetricsLoading
                                  ? "Menyiapkan rekomendasi berbasis AI..."
                                  : aiMetrics?.recommendation ||
                                    "Kumpulkan lebih banyak respons warga agar rekomendasi AI lebih akurat."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {userRole === "resident" && (
              <Card className="p-6 border-green-100">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-green-600" /> Community
                      Voting
                    </h2>
                    {project.status === "Planning" ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-gray-300">
                        Closed
                      </Badge>
                    )}
                  </div>
                  {project.status === "Planning" ? (
                    <>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handleVote("agree")}
                          disabled={isSavingVote}
                          className={cn(
                            "flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60",
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
                          disabled={isSavingVote}
                          className={cn(
                            "flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60",
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
                          Your vote has been recorded. Click again to cancel.
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed">
                        <ThumbsUp className="w-5 h-5" />
                        <span className="text-xl">{votes.agree}</span>
                        <span className="text-xs uppercase tracking-wider opacity-75">
                          Setuju
                        </span>
                      </div>
                      <div className="flex-1 h-14 flex items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed">
                        <ThumbsDown className="w-5 h-5" />
                        <span className="text-xl">{votes.disagree}</span>
                        <span className="text-xs uppercase tracking-wider opacity-75">
                          Tidak
                        </span>
                      </div>
                    </div>
                  )}
                  {project.status !== "Planning" && (
                    <p className="text-xs text-center text-gray-400 font-medium">
                      Proyek sudah memasuki tahap {project.status}.
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-green-600" />{" "}
                    Community Discussion
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
                        className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-green-50 dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 text-sm resize-none h-20 text-gray-800 dark:text-white transition-all"
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
                          Ctrl+Enter to send
                        </span>
                        <Button
                          variant="primary"
                          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-green-600 hover:bg-green-700"
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
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm text-gray-800 dark:text-white">
                              {comment.author}
                            </p>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                                comment.role?.toLowerCase() === "agency" ||
                                  comment.role?.toUpperCase() === "AGENCY"
                                  ? "bg-blue-100 text-blue-700 border-blue-300"
                                  : "bg-green-100 text-green-700 border-green-300",
                              )}
                            >
                              {comment.role?.toUpperCase() === "WARGA"
                                ? "resident"
                                : "agency"}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-white">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-white leading-relaxed">
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
            <Card className="p-6 border-0 shadow-lg bg-green-600 text-white rounded-2xl">
              <div className="relative z-10">
                <h3 className="text-xs font-medium text-green-100 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" /> Target Fund
                </h3>
                <p className="text-2xl md:text-3xl font-bold mb-5 tracking-tight">
                  {formatRupiah(project.budget)}
                </p>

                <div className="space-y-4 bg-white/10 p-4 rounded-xl border border-white/5">
                  {project.status !== "Planning" && (
                    <div>
                      <div className="flex justify-between text-[13px] text-green-50 mb-2.5">
                        <span>
                          Collected:{" "}
                          <span className="font-semibold text-white">
                            {formatRupiah(project.fundsCollected || 0)}
                          </span>
                        </span>
                        <span className="font-bold text-white">
                          {project.budget > 0
                            ? Math.round(
                                ((project.fundsCollected || 0) /
                                  project.budget) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${project.budget > 0 ? Math.round(((project.fundsCollected || 0) / project.budget) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {project.status === "Funding" ? (
                    <Link
                      href={`/app/crowdfunding/${project.id}`}
                      className="block pt-1"
                    >
                      <Button className="w-full h-11 text-sm font-bold bg-white text-green-700 hover:bg-green-50 border-none shadow-sm transition-all rounded-xl">
                        Donate Now
                      </Button>
                    </Link>
                  ) : (
                    <div className="pt-1 text-center">
                      <span className="text-xs text-green-100 font-medium opacity-90">
                        {project.status === "Planning"
                          ? "⏳ Pendanaan belum dibuka"
                          : project.status === "Completed"
                            ? "Pendanaan selesai"
                            : "Pendanaan ditutup"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="h-48 p-0 border-slate-100 shadow-sm bg-white dark:bg-[#111827] rounded-3xl overflow-hidden group relative">
              <ProjectMiniMap
                lat={project.latitude}
                lng={project.longitude}
                status={project.status}
              />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-100 dark:border-gray-800 shadow-sm pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-green-600" /> Project Location
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none group-hover:from-black/10 transition-all" />
            </Card>

            {/* Quick Actions Moved to Sidebar */}
            {userRole === "agency" && (
              <Card className="p-8 border-slate-100 shadow-sm bg-white dark:bg-[#111827] rounded-[2rem]">
                <h2 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em]">
                  <TrendingUp className="w-4 h-4 text-green-600" /> Quick
                  Actions
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
                <h2 className="font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider text-xs">
                  <FileText className="w-4 h-4 text-green-600" /> Documents
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
                                  throw new Error(
                                    "Gagal menghapus dokumen dari database",
                                  );
                                setDocuments(newDocs);
                              } catch (err) {
                                console.error(err);
                                alert(
                                  "Terjadi kesalahan saat menghapus dokumen.",
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
        onUpdateSuccess={(newStatus) =>
          setProject((prev) => ({ ...prev, status: newStatus }))
        }
      />

      {isImageViewerOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-black/50 rounded-full transition-colors z-[101]"
            onClick={() => setIsImageViewerOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="w-full max-w-5xl px-4 relative flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute left-4 md:-left-12 text-white/50 hover:text-white transition-colors"
              onClick={() =>
                setCurrentImageIndex((prev) =>
                  prev === 0 ? projectImages.length - 1 : prev - 1,
                )
              }
            >
              <ChevronLeft className="w-12 h-12" />
            </button>

            <div className="relative w-full h-[80vh]">
              <ImageWithFallback
                src={projectImages[currentImageIndex]}
                alt={project.name}
                fill
                className="object-contain rounded-lg shadow-2xl"
              />
            </div>

            <button
              className="absolute right-4 md:-right-12 text-white/50 hover:text-white transition-colors"
              onClick={() =>
                setCurrentImageIndex(
                  (prev) => (prev + 1) % projectImages.length,
                )
              }
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {projectImages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(idx);
                }}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  idx === currentImageIndex
                    ? "bg-white w-8"
                    : "bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {pdfViewerUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm p-4 md:p-10"
          onClick={() => setPdfViewerUrl(null)}
        >
          <div
            className="relative w-full max-w-5xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" /> Document Viewer
              </h3>
              <button
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                onClick={() => setPdfViewerUrl(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full bg-gray-100">
              <iframe
                src={`${pdfViewerUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Reader"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
