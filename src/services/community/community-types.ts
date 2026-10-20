import type { UserRole } from "@/context/UserContext";

export type CommunityAuthorDto = {
  name: string;
  role: UserRole;
  avatar: string;
};

export type CommunityThreadItemDto = {
  id: string;
  order: number;
  text: string;
  imageUrl: string | null;
};

export type CommunityCommentDto = {
  id: string;
  postId: string;
  author: CommunityAuthorDto;
  content: string;
  createdAt: string;
  timeLabel: string;
  likesCount: number;
  likeCount: number;
  isLiked: boolean;
  replies: CommunityCommentDto[];
};

export type CommunityPostDto = {
  id: string;
  author: CommunityAuthorDto;
  content: string;
  images: string[];
  createdAt: string;
  timeLabel: string;
  likesCount: number;
  likeCount: number;
  isLiked: boolean;
  comments: CommunityCommentDto[];
  threadItems?: CommunityThreadItemDto[];
};
