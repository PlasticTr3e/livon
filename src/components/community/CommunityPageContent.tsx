"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { LoadingState } from "@/components/shared/LoadingState";
import { useToast } from "@/components/shared/AppToaster";
import type {
  CommunityDraftItem,
  CommunityLightboxState,
  CommunityPageVariant,
  CommunityPost,
} from "@/lib/community/community-types";
import { CommunityBackBar } from "./CommunityBackBar";
import { CommunityComposerDialog } from "./CommunityComposerDialog";
import { CommunityCreateFab } from "./CommunityCreateFab";
import { CommunityFeed } from "./CommunityFeed";
import { CommunityHeader } from "./CommunityHeader";
import { CommunityImageLightbox } from "./CommunityImageLightbox";
import { CommunityPostDetail } from "./CommunityPostDetail";
import { CommunityToolbar } from "./CommunityToolbar";
import { useCommunityFeed } from "./useCommunityFeed";

type CommunityPageContentProps = {
  variant?: CommunityPageVariant;
};

const POST_PARAM = "post";

function CommunityRequestError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="px-4 py-10 text-center">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function CommunityPageContent({
  variant = "app",
}: CommunityPageContentProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedScrollTopRef = useRef(0);
  const hasOpenedFromFeedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<CommunityLightboxState | null>(null);
  const selectedPostId = searchParams.get(POST_PARAM);
  const feed = useCommunityFeed(searchQuery, selectedPostId);
  const selectedPost = feed.selectedPost;
  const isDetailOpen = Boolean(selectedPostId);
  const canModerate = variant === "admin" && feed.currentUser.role === "agency";

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    scrollContainer.scrollTop = isDetailOpen ? 0 : feedScrollTopRef.current;
  }, [isDetailOpen]);

  function handleOpenPost(postId: string) {
    feedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    hasOpenedFromFeedRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    params.set(POST_PARAM, postId);
    window.history.pushState(null, "", "?" + params);
  }

  function handleClosePost() {
    if (hasOpenedFromFeedRef.current) {
      hasOpenedFromFeedRef.current = false;
      window.history.back();
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete(POST_PARAM);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (params.size ? "?" + params : ""),
    );
  }

  function handleOpenImage(post: CommunityPost, index: number) {
    setLightbox({
      images: post.images,
      index,
      title: "Photo by " + post.author.name,
    });
  }

  async function handleCreatePost(items: CommunityDraftItem[]) {
    const saved = await feed.createPost(items);
    if (!saved) return false;
    setSearchQuery("");
    feedScrollTopRef.current = 0;
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(
      "Post published",
      "Your post has been published to Community.",
    );
    return true;
  }

  async function handleDeletePost(postId: string) {
    const deleted = await feed.deletePost(postId);
    if (!deleted) return false;
    if (postId === selectedPostId) handleClosePost();
    toast.success("Post deleted");
    return true;
  }

  return (
    <div className="relative h-full w-full bg-slate-50 dark:bg-[#0B1120]">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overscroll-contain"
      >
        {isDetailOpen ? (
          feed.isDetailLoading ? (
            <>
              <CommunityBackBar onBack={handleClosePost} />
              <LoadingState label="Loading post..." />
            </>
          ) : selectedPost ? (
            <CommunityPostDetail
              key={selectedPost.id}
              canModerate={canModerate}
              currentUser={feed.currentUser}
              post={selectedPost}
              onAddComment={(content) =>
                feed.addComment(selectedPost.id, content)
              }
              onAddReply={(commentId, content) =>
                feed.addReply(selectedPost.id, commentId, content)
              }
              onBack={handleClosePost}
              onDeleteComment={(target) =>
                feed.deleteComment(selectedPost.id, target)
              }
              onDeletePost={() => handleDeletePost(selectedPost.id)}
              onOpenImage={(index) => handleOpenImage(selectedPost, index)}
              onToggleCommentLike={(target) =>
                feed.toggleCommentLike(selectedPost.id, target)
              }
              onToggleLike={() => feed.toggleLike(selectedPost.id)}
            />
          ) : (
            <>
              <CommunityBackBar onBack={handleClosePost} />
              <CommunityRequestError
                message={feed.detailError || "Post not found."}
                onRetry={feed.retry}
              />
            </>
          )
        ) : (
          <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-24 pt-6 sm:space-y-5 sm:pb-8 md:pt-8">
            <CommunityHeader variant={variant} />
            <CommunityToolbar
              searchQuery={searchQuery}
              onCreate={() => setIsComposerOpen(true)}
              onSearchChange={setSearchQuery}
            />
            {feed.isLoading ? (
              <LoadingState label="Loading Community..." />
            ) : feed.error ? (
              <CommunityRequestError
                message={feed.error}
                onRetry={feed.retry}
              />
            ) : (
              <>
                <CommunityFeed
                  canModerate={canModerate}
                  isSearching={searchQuery.trim() !== ""}
                  posts={feed.posts}
                  onDeletePost={handleDeletePost}
                  onOpenImage={handleOpenImage}
                  onOpenPost={handleOpenPost}
                  onToggleLike={feed.toggleLike}
                />
                {feed.hasMore && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      disabled={feed.isLoadingMore}
                      onClick={() => void feed.loadMore()}
                    >
                      {feed.isLoadingMore ? "Loading..." : "Load more posts"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!isDetailOpen && (
        <CommunityCreateFab onClick={() => setIsComposerOpen(true)} />
      )}
      <CommunityComposerDialog
        author={feed.currentUser}
        isOpen={isComposerOpen}
        onOpenChange={setIsComposerOpen}
        onSubmit={handleCreatePost}
      />
      {lightbox && (
        <CommunityImageLightbox
          lightbox={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
