"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/shared/AppToaster";
import { filterCommunityPosts } from "@/lib/community/community-feed";
import type {
  CommunityDraftItem,
  CommunityLightboxState,
  CommunityPageVariant,
  CommunityPost,
} from "@/lib/community/community-types";
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

export function CommunityPageContent({
  variant = "app",
}: CommunityPageContentProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const feed = useCommunityFeed();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const feedScrollTopRef = useRef(0);
  const hasOpenedFromFeedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [lightbox, setLightbox] = useState<CommunityLightboxState | null>(null);

  const canModerate = variant === "admin";
  const selectedPostId = searchParams.get(POST_PARAM);
  const selectedPost =
    feed.posts.find((post) => post.id === selectedPostId) ?? null;
  const isDetailOpen = selectedPost !== null;
  const filteredPosts = useMemo(
    () => filterCommunityPosts(feed.posts, searchQuery),
    [feed.posts, searchQuery],
  );

  // The feed and the detail share one scroll container, so put the reader back
  // where they left the feed instead of at the top.
  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = isDetailOpen ? 0 : feedScrollTopRef.current;
  }, [isDetailOpen]);

  // The open post lives in the URL so the device back button closes it.
  function handleOpenPost(postId: string) {
    feedScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    hasOpenedFromFeedRef.current = true;
    window.history.pushState(
      null,
      "",
      `?${POST_PARAM}=${encodeURIComponent(postId)}`,
    );
  }

  function handleClosePost() {
    if (hasOpenedFromFeedRef.current) {
      hasOpenedFromFeedRef.current = false;
      window.history.back();
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
  }

  function handleOpenImage(post: CommunityPost, index: number) {
    setLightbox({
      images: post.images,
      index,
      title: `Foto dari ${post.author.name}`,
    });
  }

  function handleCreatePost(items: CommunityDraftItem[]) {
    feed.createPost(items);
    setSearchQuery("");
    feedScrollTopRef.current = 0;
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(
      "Aspirasi terkirim",
      "Postingan Anda sudah tampil di komunitas.",
    );
  }

  function handleDeletePost(postId: string) {
    if (postId === selectedPostId) {
      handleClosePost();
    }
    feed.deletePost(postId);
    toast.success("Postingan dihapus");
  }

  return (
    <div className="relative h-full w-full bg-slate-50 dark:bg-[#0B1120]">
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overscroll-contain"
      >
        {selectedPost ? (
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
          <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-24 pt-6 sm:space-y-5 sm:pb-8 md:pt-8">
            <CommunityHeader variant={variant} />
            <CommunityToolbar
              searchQuery={searchQuery}
              onCreate={() => setIsComposerOpen(true)}
              onSearchChange={setSearchQuery}
            />
            <CommunityFeed
              canModerate={canModerate}
              isSearching={searchQuery.trim() !== ""}
              posts={filteredPosts}
              onDeletePost={handleDeletePost}
              onOpenImage={handleOpenImage}
              onOpenPost={handleOpenPost}
              onToggleLike={feed.toggleLike}
            />
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
