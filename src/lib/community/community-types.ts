import type { UserRole } from "@/context/UserContext";

export type CommunityPageVariant = "app" | "admin";

export type CommunityAuthor = {
  name: string;
  role: UserRole;
};

export type CommunityReply = {
  id: string;
  author: CommunityAuthor;
  timeLabel: string;
  content: string;
  likeCount: number;
  isLiked: boolean;
};

export type CommunityComment = CommunityReply & {
  replies: CommunityReply[];
};

export type CommunityPost = {
  id: string;
  author: CommunityAuthor;
  timeLabel: string;
  content: string;
  images: string[];
  likeCount: number;
  isLiked: boolean;
  comments: CommunityComment[];
};

export type CommunityCommentTarget = {
  commentId: string;
  replyId?: string;
};

export type CommunityReplyTarget = {
  commentId: string;
  authorName: string;
};

export type CommunityDraftItem = {
  id: string;
  text: string;
  image: string | null;
};

export type CommunityLightboxState = {
  images: string[];
  index: number;
  title: string;
};
