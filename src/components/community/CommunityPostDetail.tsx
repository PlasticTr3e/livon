"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { getCommunityCommentCount } from "@/lib/community/community-feed";
import type {
  CommunityAuthor,
  CommunityComment,
  CommunityCommentTarget,
  CommunityPost,
  CommunityReplyTarget,
} from "@/lib/community/community-types";
import { CommunityBackBar } from "./CommunityBackBar";
import { CommunityCommentComposer } from "./CommunityCommentComposer";
import { CommunityCommentList } from "./CommunityCommentList";
import { CommunityPostActions } from "./CommunityPostActions";
import { CommunityPostContent } from "./CommunityPostContent";
import styles from "./community.module.css";

type CommunityPostDetailProps = {
  canModerate: boolean;
  currentUser: CommunityAuthor;
  post: CommunityPost;
  onAddComment: (content: string) => void;
  onAddReply: (commentId: string, content: string) => void;
  onBack: () => void;
  onDeleteComment: (target: CommunityCommentTarget) => void;
  onDeletePost: () => void;
  onOpenImage: (index: number) => void;
  onToggleCommentLike: (target: CommunityCommentTarget) => void;
  onToggleLike: () => void;
};

export function CommunityPostDetail({
  canModerate,
  currentUser,
  post,
  onAddComment,
  onAddReply,
  onBack,
  onDeleteComment,
  onDeletePost,
  onOpenImage,
  onToggleCommentLike,
  onToggleLike,
}: CommunityPostDetailProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommunityReplyTarget | null>(
    null,
  );
  const commentCount = getCommunityCommentCount(post);

  function handleReply(comment: CommunityComment) {
    setReplyTarget({
      commentId: comment.id,
      authorName: comment.author.name,
    });
    inputRef.current?.focus();
  }

  function handleDeleteComment(target: CommunityCommentTarget) {
    if (!target.replyId && target.commentId === replyTarget?.commentId) {
      setReplyTarget(null);
    }
    onDeleteComment(target);
  }

  function handleSubmit() {
    const content = commentText.trim();
    if (!content) return;

    if (replyTarget) {
      onAddReply(replyTarget.commentId, content);
    } else {
      onAddComment(content);
      // Wait for the new comment to render before bringing it into view.
      window.requestAnimationFrame(() =>
        listEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        }),
      );
    }

    setCommentText("");
    setReplyTarget(null);
  }

  return (
    <div className="flex min-h-full flex-col">
      <CommunityBackBar onBack={onBack} />

      <div className="mx-auto w-full max-w-2xl px-4 py-4 md:py-6">
        <Card
          className={`overflow-hidden rounded-2xl dark:border-gray-800 dark:bg-[#1F2937] ${styles.enter}`}
        >
          <div className="p-4 pb-2">
            <CommunityPostContent post={post} onOpenImage={onOpenImage} />
            <CommunityPostActions
              post={post}
              onComment={() => inputRef.current?.focus()}
              onDelete={canModerate ? onDeletePost : undefined}
              onToggleLike={onToggleLike}
            />
          </div>

          <section className="border-t border-gray-100 dark:border-gray-800">
            <h2 className="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Komentar{commentCount > 0 && ` · ${commentCount}`}
            </h2>
            <CommunityCommentList
              canModerate={canModerate}
              comments={post.comments}
              onDelete={handleDeleteComment}
              onReply={handleReply}
              onToggleLike={onToggleCommentLike}
            />
          </section>
        </Card>
        <div ref={listEndRef} className="scroll-mb-24" />
      </div>

      <CommunityCommentComposer
        currentUser={currentUser}
        inputRef={inputRef}
        replyTarget={replyTarget}
        value={commentText}
        onCancelReply={() => setReplyTarget(null)}
        onChange={setCommentText}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
