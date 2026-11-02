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
  onAddComment: (content: string) => Promise<boolean>;
  onAddReply: (commentId: string, content: string) => Promise<boolean>;
  onBack: () => void;
  onDeleteComment: (target: CommunityCommentTarget) => Promise<boolean>;
  onDeletePost: () => void | Promise<unknown>;
  onOpenImage: (index: number) => void;
  onToggleCommentLike: (
    target: CommunityCommentTarget,
  ) => void | Promise<unknown>;
  onToggleLike: () => void | Promise<unknown>;
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
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommunityReplyTarget | null>(
    null,
  );
  const commentCount = getCommunityCommentCount(post);

  function handleReply(comment: CommunityComment) {
    if (submitting.current) return;
    setReplyTarget({
      commentId: comment.id,
      authorName: comment.author.name,
    });
    inputRef.current?.focus();
  }

  async function handleDeleteComment(target: CommunityCommentTarget) {
    const deleted = await onDeleteComment(target);
    if (
      deleted &&
      !target.replyId &&
      target.commentId === replyTarget?.commentId
    ) {
      setReplyTarget(null);
    }
  }

  async function handleSubmit() {
    const content = commentText.trim();
    if (!content || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const saved = replyTarget
        ? await onAddReply(replyTarget.commentId, content)
        : await onAddComment(content);
      if (!saved) return;
      setCommentText("");
      setReplyTarget(null);
      if (!replyTarget) {
        window.requestAnimationFrame(() =>
          listEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        );
      }
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
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
              Comments{commentCount > 0 && ` · ${commentCount}`}
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
        isSubmitting={isSubmitting}
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
