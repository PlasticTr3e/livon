"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/components/shared/AppToaster";
import {
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityPost,
  fetchCommunityPosts,
  likeCommunityComment,
  likeCommunityPost,
  publishCommunityPost,
  sendCommunityComment,
  type CommunityPagination,
} from "@/lib/community/community-api";
import { removeCommunityComment } from "@/lib/community/community-feed";
import type {
  CommunityAuthor,
  CommunityCommentTarget,
  CommunityDraftItem,
  CommunityPost,
} from "@/lib/community/community-types";

const EMPTY_PAGINATION: CommunityPagination = {
  page: 0,
  limit: 20,
  total: 0,
  totalPages: 0,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function useCommunityFeed(
  searchQuery: string,
  selectedPostId: string | null,
) {
  const { userName, userRole, isUserLoading, isAuthenticated } = useUser();
  const toast = useToast();
  const search = searchQuery.trim();
  const [list, setList] = useState({
    posts: [] as CommunityPost[],
    pagination: EMPTY_PAGINATION,
    query: "",
    loading: true,
    error: null as string | null,
  });
  const [detail, setDetail] = useState({
    id: null as string | null,
    post: null as CommunityPost | null,
    loading: false,
    error: null as string | null,
  });
  const [revision, setRevision] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const feedController = useRef<AbortController | null>(null);
  const loadingMore = useRef(false);
  const pendingMutations = useRef(new Set<string>());

  const currentUser = useMemo<CommunityAuthor>(
    () => ({ name: userName, role: userRole }),
    [userName, userRole],
  );

  useEffect(() => {
    if (isUserLoading) return;
    const controller = new AbortController();
    feedController.current = controller;
    const timer = window.setTimeout(
      async () => {
        setList((current) => ({
          ...current,
          query: search,
          loading: true,
          error: null,
        }));
        setIsLoadingMore(false);
        try {
          const result = await fetchCommunityPosts(
            search,
            1,
            controller.signal,
          );
          if (!controller.signal.aborted) {
            setList({ ...result, query: search, loading: false, error: null });
          }
        } catch (error) {
          if (!controller.signal.aborted) {
            setList((current) => ({
              ...current,
              query: search,
              loading: false,
              error: getErrorMessage(error),
            }));
          }
        }
      },
      search ? 300 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, isUserLoading, isAuthenticated, revision]);

  useEffect(() => {
    if (!selectedPostId || isUserLoading) return;
    const postId = selectedPostId;
    const controller = new AbortController();
    async function loadDetail() {
      setDetail({ id: selectedPostId, post: null, loading: true, error: null });
      try {
        const post = await fetchCommunityPost(postId, controller.signal);
        if (!controller.signal.aborted) {
          setDetail({ id: selectedPostId, post, loading: false, error: null });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setDetail({
            id: selectedPostId,
            post: null,
            loading: false,
            error: getErrorMessage(error),
          });
        }
      }
    }
    void loadDetail();
    return () => controller.abort();
  }, [selectedPostId, isUserLoading, isAuthenticated, revision]);

  const updatePost = useCallback(
    (id: string, update: (post: CommunityPost) => CommunityPost) => {
      setList((current) => ({
        ...current,
        posts: current.posts.map((post) =>
          post.id === id ? update(post) : post,
        ),
      }));
      setDetail((current) => ({
        ...current,
        post: current.post?.id === id ? update(current.post) : current.post,
      }));
    },
    [],
  );

  const mutate = useCallback(
    async (key: string, action: () => Promise<void>) => {
      if (pendingMutations.current.has(key)) return false;
      if (!localStorage.getItem("livon-token")) {
        toast.error("Sign in required", "Please sign in to continue.");
        return false;
      }
      pendingMutations.current.add(key);
      try {
        await action();
        return true;
      } catch (error) {
        toast.error("Action failed", getErrorMessage(error));
        return false;
      } finally {
        pendingMutations.current.delete(key);
      }
    },
    [toast],
  );

  const isLoading = isUserLoading || list.loading || list.query !== search;

  async function loadMore() {
    const controller = feedController.current;
    if (
      !controller ||
      controller.signal.aborted ||
      isLoading ||
      loadingMore.current ||
      list.pagination.page >= list.pagination.totalPages
    )
      return;
    loadingMore.current = true;
    setIsLoadingMore(true);
    try {
      const result = await fetchCommunityPosts(
        search,
        list.pagination.page + 1,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setList((current) => {
          const ids = new Set(current.posts.map((post) => post.id));
          return {
            ...current,
            posts: [
              ...current.posts,
              ...result.posts.filter((post) => !ids.has(post.id)),
            ],
            pagination: result.pagination,
          };
        });
      }
    } catch (error) {
      if (!controller.signal.aborted)
        toast.error("Could not load posts", getErrorMessage(error));
    } finally {
      loadingMore.current = false;
      if (!controller.signal.aborted) setIsLoadingMore(false);
    }
  }

  return {
    currentUser,
    posts: list.posts,
    isLoading,
    error: list.error,
    isLoadingMore,
    hasMore: list.pagination.page < list.pagination.totalPages,
    selectedPost: detail.id === selectedPostId ? detail.post : null,
    isDetailLoading:
      Boolean(selectedPostId) &&
      (isUserLoading || detail.id !== selectedPostId || detail.loading),
    detailError: detail.id === selectedPostId ? detail.error : null,
    retry: () => setRevision((current) => current + 1),
    loadMore,
    createPost: (items: CommunityDraftItem[]) =>
      mutate("create", async () => {
        const post = await publishCommunityPost(items);
        setList((current) => ({ ...current, posts: [post, ...current.posts] }));
      }),
    deletePost: (postId: string) =>
      mutate("delete-post:" + postId, async () => {
        await deleteCommunityPost(postId);
        setRevision((current) => current + 1);
        setList((current) => ({
          ...current,
          posts: current.posts.filter((post) => post.id !== postId),
        }));
        setDetail((current) =>
          current.id === postId ? { ...current, post: null } : current,
        );
      }),
    toggleLike: (postId: string) =>
      mutate("like-post:" + postId, async () => {
        const result = await likeCommunityPost(postId);
        updatePost(postId, (post) => ({
          ...post,
          isLiked: result.isLiked,
          likeCount: result.likesCount ?? result.likeCount ?? 0,
        }));
      }),
    toggleCommentLike: (postId: string, target: CommunityCommentTarget) =>
      mutate(
        "comment-like:" + (target.replyId ?? target.commentId),
        async () => {
          const result = await likeCommunityComment(
            target.replyId ?? target.commentId,
          );
          const changes = {
            isLiked: result.isLiked,
            likeCount: result.likesCount ?? result.likeCount ?? 0,
          };
          updatePost(postId, (post) => ({
            ...post,
            comments: post.comments.map((comment) =>
              comment.id !== target.commentId
                ? comment
                : target.replyId
                  ? {
                      ...comment,
                      replies: comment.replies.map((reply) =>
                        reply.id === target.replyId
                          ? { ...reply, ...changes }
                          : reply,
                      ),
                    }
                  : { ...comment, ...changes },
            ),
          }));
        },
      ),
    addComment: (postId: string, content: string) =>
      mutate("comment:" + postId, async () => {
        const comment = await sendCommunityComment(postId, content);
        updatePost(postId, (post) => ({
          ...post,
          comments: [...post.comments, comment],
        }));
      }),
    addReply: (postId: string, commentId: string, content: string) =>
      mutate("comment:" + postId, async () => {
        const reply = await sendCommunityComment(postId, content, commentId);
        updatePost(postId, (post) => ({
          ...post,
          comments: post.comments.map((comment) =>
            comment.id === commentId
              ? { ...comment, replies: [...comment.replies, reply] }
              : comment,
          ),
        }));
      }),
    deleteComment: (postId: string, target: CommunityCommentTarget) =>
      mutate(
        "delete-comment:" + (target.replyId ?? target.commentId),
        async () => {
          await deleteCommunityComment(target.replyId ?? target.commentId);
          updatePost(
            postId,
            (post) => removeCommunityComment([post], postId, target)[0],
          );
        },
      ),
  };
}
