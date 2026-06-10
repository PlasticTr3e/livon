import { Card } from "@/components/ui/primitives";
import { AdminCommentCard } from "@/components/admin-comments/AdminCommentCard";
import { AdminCommentsFilters } from "@/components/admin-comments/AdminCommentsFilters";
import { LoadingState } from "@/components/shared/LoadingState";
import type {
  AdminCommentItem,
  AdminCommentSentimentFilter,
} from "@/lib/admin-comments/admin-comments-types";
import { MessageSquare } from "lucide-react";

type AdminCommentsListProps = {
  isLoading: boolean;
  comments: AdminCommentItem[];
  searchQuery: string;
  sentimentFilter: AdminCommentSentimentFilter;
  onSearchChange: (searchQuery: string) => void;
  onSentimentFilterChange: (filter: AdminCommentSentimentFilter) => void;
  onDeleteComment: (commentId: string) => void;
};

export function AdminCommentsList({
  isLoading,
  comments,
  searchQuery,
  sentimentFilter,
  onSearchChange,
  onSentimentFilterChange,
  onDeleteComment,
}: AdminCommentsListProps) {
  return (
    <Card className="border-green-100 p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <AdminCommentsFilters
        searchQuery={searchQuery}
        sentimentFilter={sentimentFilter}
        onSearchChange={onSearchChange}
        onSentimentFilterChange={onSentimentFilterChange}
      />

      <div className="space-y-3">
        {isLoading ? (
          <AdminCommentsLoadingState />
        ) : comments.length === 0 ? (
          <AdminCommentsEmptyState />
        ) : (
          comments.map((comment) => (
            <AdminCommentCard
              key={comment.id}
              comment={comment}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function AdminCommentsLoadingState() {
  return (
    <LoadingState
      label="Loading comments..."
      variant="panel"
      className="bg-transparent"
    />
  );
}

function AdminCommentsEmptyState() {
  return (
    <div className="py-10 text-center">
      <MessageSquare className="mx-auto mb-2 h-10 w-10 text-gray-300" />
      <p className="font-medium text-gray-400">
        Tidak ada komentar yang ditemukan di proyek ini.
      </p>
    </div>
  );
}
