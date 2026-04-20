"use client";
import { useState, useEffect } from "react";
import {
  Card,
  Badge,
  Button,
  Input,
  cn,
} from "@/components/ui/WireframePrimitives";
import {
  MessageSquare,
  Search,
  Trash2,
  ShieldAlert,
  CheckCircle,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFlagged, setShowFlagged] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Format waktu ke format relatif
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h lalu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d lalu`;

    return date.toLocaleDateString("id-ID");
  }

  // Deteksi sentiment dari text
  const analyzeSentiment = (
    text: string,
    score?: number,
  ): "Positive" | "Negative" | "Neutral" => {
    // Jika ada sentimentScore dari database, gunakan itu
    if (score !== null && score !== undefined) {
      if (score > 0.5) return "Positive";
      if (score < -0.5) return "Negative";
      return "Neutral";
    }

    // Fallback ke keyword analysis
    const positiveWords = [
      "bagus",
      "setuju",
      "mendukung",
      "alhamdulillah",
      "terima kasih",
      "bermanfaat",
      "selesai",
      "jernih",
      "hebat",
      "mantap",
    ];
    const negativeWords = [
      "berbahaya",
      "hilang",
      "rusak",
      "masalah",
      "kecewa",
      "tidak",
      "waste",
      "dangerous",
      "jelek",
    ];
    const lower = text.toLowerCase();

    if (positiveWords.some((w) => lower.includes(w))) return "Positive";
    if (negativeWords.some((w) => lower.includes(w))) return "Negative";
    return "Neutral";
  };

  // Deteksi comment yang ditandai (flagged)
  /* const isFlagged = (sentimentLabel?: string) => {
    return sentimentLabel === "NEGATIVE" || sentimentLabel === "TOXIC";
  }; */

  // Map role dari database ke display name
  const mapRole = (role: string): "Resident" | "Manager" | "Admin" => {
    const upperRole = role.toUpperCase();
    if (upperRole.includes("ADMIN")) return "Admin";
    if (upperRole.includes("MANAGER")) return "Manager";
    return "Resident";
  };

  // Fetch comments dari API
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");

        const response = await fetch("/api/comments/admin", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        const result = await response.json();
        const commentsData = result.data;

        const transformedComments: CommentItem[] = (commentsData || []).map(
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
            const sentiment = analyzeSentiment(
              comment.text,
              comment.sentimentScore,
            );

            return {
              id: comment.id,
              // Karena di model User tidak ada 'name', kita pakai email atau fallback
              author: comment.user?.email || "Unknown User",
              text: comment.text || "",
              timestamp: formatTimeAgo(comment.createdAt),
              role: mapRole(comment.user?.role || "WARGA"), // Sesuai Enum: WARGA / AGENCY
              projectName:
                comment.project?.title || comment.news?.title || "Berita", // Ganti .name jadi .title
              projectId: comment.projectId,
              flag: comment.sentimentLabel === "NEGATIF", // Sesuai Enum: NEGATIF
              userId: comment.userId,
              createdAt: comment.createdAt,
              sentiment: sentiment,
            };
          },
        );

        setAllComments(transformedComments);
      } catch (error) {
        console.error("❌ Error fetching comments:", error);
        setAllComments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, []);

  // Handle delete comment
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

  // Handle flag comment
  const handleFlagComment = async (commentId: string, currentFlag: boolean) => {
    try {
      const token = localStorage.getItem("livon-token");
      const newSentimentLabel = currentFlag ? null : "NEGATIF";

      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentimentLabel: newSentimentLabel }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment");
      }

      setAllComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, flag: !currentFlag } : c,
        ),
      );
    } catch (error) {
      console.error("Error updating comment:", error);
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

  const filtered = allComments.filter((c) => {
    if (deletedIds.includes(c.id)) return false;
    const matchSearch =
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch && (!showFlagged || c.flag);
  });

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Monitor Komentar
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review diskusi komunitas per proyek dan sentimen.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5 text-sm">
            {loading ? "Loading..." : `${filtered.length} komentar`}
          </Badge>
        </div>
      </div>

      <Card className="p-5 border-green-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 border-green-200 w-full"
              placeholder="Cari komentar, pengguna, proyek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFlagged(!showFlagged)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              showFlagged
                ? "bg-red-100 border-red-300 text-red-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-red-300",
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            {showFlagged ? "Semua Komentar" : "Tampilkan yang Ditandai"}
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-400 font-medium">Memuat komentar...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 font-medium">
                Tidak ada komentar yang ditemukan.
              </p>
            </div>
          ) : (
            filtered.map((comment) => (
              <div
                key={comment.id}
                className={cn(
                  "p-4 border rounded-xl flex items-start gap-4 bg-white hover:bg-green-50 transition-colors",
                  comment.flag ? "border-red-200 bg-red-50" : "border-gray-100",
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
                      <span className="font-bold text-gray-900 text-sm">
                        {comment.author}
                      </span>
                      <span className="text-gray-400 text-xs font-normal ml-2">
                        di
                      </span>
                      <span className="text-green-600 text-xs font-semibold ml-1">
                        {comment.projectName}
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
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-gray-400">
                      {comment.timestamp}
                    </span>
                    <Button
                      variant="outline"
                      className="h-7 text-xs py-0 px-2.5 border-green-300 text-green-700"
                    >
                      Balas
                    </Button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus
                    </button>
                    {!comment.flag && (
                      <button
                        onClick={() => handleFlagComment(comment.id, false)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-yellow-600 font-medium transition-colors"
                      >
                        <ShieldAlert className="w-3 h-3" /> Tandai
                      </button>
                    )}
                    {comment.flag && (
                      <button
                        onClick={() => handleFlagComment(comment.id, true)}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Setujui
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
