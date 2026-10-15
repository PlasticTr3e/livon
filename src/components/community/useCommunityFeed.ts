"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { INITIAL_COMMUNITY_POSTS } from "@/lib/community/community-data";
import {
  addCommunityComment,
  addCommunityReply,
  createCommunityPost,
  removeCommunityComment,
  removeCommunityPost,
  toggleCommentLike,
  togglePostLike,
} from "@/lib/community/community-feed";
import type {
  CommunityAuthor,
  CommunityCommentTarget,
  CommunityDraftItem,
  CommunityPost,
} from "@/lib/community/community-types";

export function useCommunityFeed() {
  const { userName, userRole } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);

  const currentUser = useMemo<CommunityAuthor>(
    () => ({ name: userName, role: userRole }),
    [userName, userRole],
  );

  return {
    currentUser,
    posts,
    createPost: (items: CommunityDraftItem[]) =>
      setPosts((current) => [
        createCommunityPost(currentUser, items),
        ...current,
      ]),
    deletePost: (postId: string) =>
      setPosts((current) => removeCommunityPost(current, postId)),
    toggleLike: (postId: string) =>
      setPosts((current) => togglePostLike(current, postId)),
    toggleCommentLike: (postId: string, target: CommunityCommentTarget) =>
      setPosts((current) => toggleCommentLike(current, postId, target)),
    addComment: (postId: string, content: string) =>
      setPosts((current) =>
        addCommunityComment(current, postId, currentUser, content),
      ),
    addReply: (postId: string, commentId: string, content: string) =>
      setPosts((current) =>
        addCommunityReply(current, postId, commentId, currentUser, content),
      ),
    deleteComment: (postId: string, target: CommunityCommentTarget) =>
      setPosts((current) => removeCommunityComment(current, postId, target)),
  };
}
