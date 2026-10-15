import type {
  CommunityAuthor,
  CommunityComment,
  CommunityCommentTarget,
  CommunityDraftItem,
  CommunityPost,
  CommunityReply,
} from "./community-types";

export const MAX_COMMUNITY_DRAFT_ITEMS = 5;

const NEW_ENTRY_TIME_LABEL = "Baru saja";

export function createCommunityId() {
  return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
}

export function filterCommunityPosts(posts: CommunityPost[], query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return posts;

  return posts.filter(
    (post) =>
      post.content.toLowerCase().includes(keyword) ||
      post.author.name.toLowerCase().includes(keyword),
  );
}

export function getCommunityCommentCount(post: CommunityPost) {
  return post.comments.reduce(
    (total, comment) => total + 1 + comment.replies.length,
    0,
  );
}

export function hasCommunityDraftContent(items: CommunityDraftItem[]) {
  return Boolean(items[0]?.text.trim());
}

export function revokeCommunityDraftImage(image: string | null) {
  if (image?.startsWith("blob:")) {
    URL.revokeObjectURL(image);
  }
}

export function createCommunityPost(
  author: CommunityAuthor,
  items: CommunityDraftItem[],
): CommunityPost {
  return {
    id: createCommunityId(),
    author,
    timeLabel: NEW_ENTRY_TIME_LABEL,
    content: items
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join("\n\n"),
    images: items.flatMap((item) => (item.image ? [item.image] : [])),
    likeCount: 0,
    isLiked: false,
    comments: [],
  };
}

export function removeCommunityPost(posts: CommunityPost[], postId: string) {
  return posts.filter((post) => post.id !== postId);
}

export function togglePostLike(posts: CommunityPost[], postId: string) {
  return updatePost(posts, postId, toggleLike);
}

export function toggleCommentLike(
  posts: CommunityPost[],
  postId: string,
  target: CommunityCommentTarget,
) {
  return updateComment(posts, postId, target.commentId, (comment) =>
    target.replyId
      ? {
          ...comment,
          replies: comment.replies.map((reply) =>
            reply.id === target.replyId ? toggleLike(reply) : reply,
          ),
        }
      : toggleLike(comment),
  );
}

export function addCommunityComment(
  posts: CommunityPost[],
  postId: string,
  author: CommunityAuthor,
  content: string,
) {
  return updatePost(posts, postId, (post) => ({
    ...post,
    comments: [
      ...post.comments,
      { ...createReply(author, content), replies: [] },
    ],
  }));
}

export function addCommunityReply(
  posts: CommunityPost[],
  postId: string,
  commentId: string,
  author: CommunityAuthor,
  content: string,
) {
  return updateComment(posts, postId, commentId, (comment) => ({
    ...comment,
    replies: [...comment.replies, createReply(author, content)],
  }));
}

export function removeCommunityComment(
  posts: CommunityPost[],
  postId: string,
  target: CommunityCommentTarget,
) {
  if (!target.replyId) {
    return updatePost(posts, postId, (post) => ({
      ...post,
      comments: post.comments.filter(
        (comment) => comment.id !== target.commentId,
      ),
    }));
  }

  return updateComment(posts, postId, target.commentId, (comment) => ({
    ...comment,
    replies: comment.replies.filter((reply) => reply.id !== target.replyId),
  }));
}

function createReply(author: CommunityAuthor, content: string): CommunityReply {
  return {
    id: createCommunityId(),
    author,
    timeLabel: NEW_ENTRY_TIME_LABEL,
    content,
    likeCount: 0,
    isLiked: false,
  };
}

function toggleLike<T extends { isLiked: boolean; likeCount: number }>(
  item: T,
): T {
  return {
    ...item,
    isLiked: !item.isLiked,
    likeCount: item.likeCount + (item.isLiked ? -1 : 1),
  };
}

function updatePost(
  posts: CommunityPost[],
  postId: string,
  update: (post: CommunityPost) => CommunityPost,
) {
  return posts.map((post) => (post.id === postId ? update(post) : post));
}

function updateComment(
  posts: CommunityPost[],
  postId: string,
  commentId: string,
  update: (comment: CommunityComment) => CommunityComment,
) {
  return updatePost(posts, postId, (post) => ({
    ...post,
    comments: post.comments.map((comment) =>
      comment.id === commentId ? update(comment) : comment,
    ),
  }));
}
