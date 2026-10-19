import prisma from "@/lib/prisma";
import { Role } from "@/generated/prisma/enums";
import type { UserRole } from "@/context/UserContext";
import type {
  CreateCommentInput,
  CreatePostInput,
  PostQueryInput,
} from "./community-schema";
import type {
  CommunityAuthorDto,
  CommunityCommentDto,
  CommunityPostDto,
  CommunityThreadItemDto,
} from "./community-types";

/**
 * Formats relative time into a user-friendly label matching the frontend expectations.
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000,
  );

  if (diffInSeconds < 60) return "Baru saja";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) return `${diffInWeeks} minggu lalu`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} bulan lalu`;

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} tahun lalu`;
}

type UserWithProfiles = {
  id: string;
  email: string;
  role: Role | null;
  citizenProfile?: { fullName: string } | null;
  agencyProfile?: { agencyName: string } | null;
};

/**
 * Maps Prisma User with profiles to CommunityAuthorDto.
 */
function mapCommunityAuthor(user: UserWithProfiles): CommunityAuthorDto {
  const isAgency = user.role === Role.AGENCY;
  const displayName =
    user.citizenProfile?.fullName ||
    user.agencyProfile?.agencyName ||
    user.email.split("@")[0] ||
    "User";

  const role: UserRole = isAgency ? "agency" : "resident";

  return {
    name: displayName,
    role,
    avatar: "",
  };
}

/**
 * Retrieves community posts feed with optional text search, pagination, and descending order by createdAt.
 */
export async function getCommunityPosts(
  query: PostQueryInput,
  currentUserId?: string,
): Promise<{
  posts: CommunityPostDto[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const search = query.search?.trim();
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const whereClause = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            {
              content: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              user: {
                citizenProfile: {
                  fullName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              user: {
                agencyProfile: {
                  agencyName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [postsData, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            citizenProfile: { select: { fullName: true } },
            agencyProfile: { select: { agencyName: true } },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { deletedAt: null } },
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        comments: {
          where: {
            deletedAt: null,
            parentId: null,
          },
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                citizenProfile: { select: { fullName: true } },
                agencyProfile: { select: { agencyName: true } },
              },
            },
            _count: {
              select: {
                likes: true,
                replies: { where: { deletedAt: null } },
              },
            },
            likes: currentUserId
              ? {
                  where: { userId: currentUserId },
                  select: { id: true },
                }
              : false,
            replies: {
              where: { deletedAt: null },
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    citizenProfile: { select: { fullName: true } },
                    agencyProfile: { select: { agencyName: true } },
                  },
                },
                _count: {
                  select: {
                    likes: true,
                  },
                },
                likes: currentUserId
                  ? {
                      where: { userId: currentUserId },
                      select: { id: true },
                    }
                  : false,
              },
            },
          },
        },
      },
    }),
    prisma.communityPost.count({ where: whereClause }),
  ]);

  const formattedPosts: CommunityPostDto[] = postsData.map((post) => {
    const author = mapCommunityAuthor(post.user);
    const isLiked = Boolean(
      currentUserId && post.likes && post.likes.length > 0,
    );
    const timeLabel = formatRelativeTime(post.createdAt);
    const likesCount = post._count.likes;

    const comments: CommunityCommentDto[] = post.comments.map((comment) => {
      const commentAuthor = mapCommunityAuthor(comment.user);
      const isCommentLiked = Boolean(
        currentUserId && comment.likes && comment.likes.length > 0,
      );
      const commentTimeLabel = formatRelativeTime(comment.createdAt);
      const commentLikesCount = comment._count.likes;

      const replies: CommunityCommentDto[] = comment.replies.map((reply) => {
        const replyAuthor = mapCommunityAuthor(reply.user);
        const isReplyLiked = Boolean(
          currentUserId && reply.likes && reply.likes.length > 0,
        );
        const replyTimeLabel = formatRelativeTime(reply.createdAt);
        const replyLikesCount = reply._count.likes;

        return {
          id: reply.id,
          postId: reply.postId,
          author: replyAuthor,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          timeLabel: replyTimeLabel,
          likesCount: replyLikesCount,
          likeCount: replyLikesCount,
          isLiked: isReplyLiked,
          replies: [],
        };
      });

      return {
        id: comment.id,
        postId: comment.postId,
        author: commentAuthor,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        timeLabel: commentTimeLabel,
        likesCount: commentLikesCount,
        likeCount: commentLikesCount,
        isLiked: isCommentLiked,
        replies,
      };
    });

    return {
      id: post.id,
      author,
      content: post.content,
      images: post.images,
      createdAt: post.createdAt.toISOString(),
      timeLabel,
      likesCount,
      likeCount: likesCount,
      isLiked,
      comments,
    };
  });

  return {
    posts: formattedPosts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Retrieves a single community post by ID including full comment hierarchy.
 */
export async function getCommunityPostDetail(
  postId: string,
  currentUserId?: string,
): Promise<CommunityPostDto | null> {
  const post = await prisma.communityPost.findFirst({
    where: { id: postId, deletedAt: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          citizenProfile: { select: { fullName: true } },
          agencyProfile: { select: { agencyName: true } },
        },
      },
      threadItems: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          likes: true,
          comments: { where: { deletedAt: null } },
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
      comments: {
        where: {
          deletedAt: null,
          parentId: null,
        },
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              citizenProfile: { select: { fullName: true } },
              agencyProfile: { select: { agencyName: true } },
            },
          },
          _count: {
            select: {
              likes: true,
              replies: { where: { deletedAt: null } },
            },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  citizenProfile: { select: { fullName: true } },
                  agencyProfile: { select: { agencyName: true } },
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
              likes: currentUserId
                ? {
                    where: { userId: currentUserId },
                    select: { id: true },
                  }
                : false,
            },
          },
        },
      },
    },
  });

  if (!post) return null;

  const author = mapCommunityAuthor(post.user);
  const isLiked = Boolean(currentUserId && post.likes && post.likes.length > 0);
  const timeLabel = formatRelativeTime(post.createdAt);
  const likesCount = post._count.likes;

  const comments: CommunityCommentDto[] = post.comments.map((comment) => {
    const commentAuthor = mapCommunityAuthor(comment.user);
    const isCommentLiked = Boolean(
      currentUserId && comment.likes && comment.likes.length > 0,
    );
    const commentTimeLabel = formatRelativeTime(comment.createdAt);
    const commentLikesCount = comment._count.likes;

    const replies: CommunityCommentDto[] = comment.replies.map((reply) => {
      const replyAuthor = mapCommunityAuthor(reply.user);
      const isReplyLiked = Boolean(
        currentUserId && reply.likes && reply.likes.length > 0,
      );
      const replyTimeLabel = formatRelativeTime(reply.createdAt);
      const replyLikesCount = reply._count.likes;

      return {
        id: reply.id,
        postId: reply.postId,
        author: replyAuthor,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        timeLabel: replyTimeLabel,
        likesCount: replyLikesCount,
        likeCount: replyLikesCount,
        isLiked: isReplyLiked,
        replies: [],
      };
    });

    return {
      id: comment.id,
      postId: comment.postId,
      author: commentAuthor,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      timeLabel: commentTimeLabel,
      likesCount: commentLikesCount,
      likeCount: commentLikesCount,
      isLiked: isCommentLiked,
      replies,
    };
  });

  const threadItems: CommunityThreadItemDto[] = post.threadItems.map(
    (item) => ({
      id: item.id,
      order: item.order,
      text: item.text,
      imageUrl: item.imageUrl,
    }),
  );

  return {
    id: post.id,
    author,
    content: post.content,
    images: post.images,
    createdAt: post.createdAt.toISOString(),
    timeLabel,
    likesCount,
    likeCount: likesCount,
    isLiked,
    comments,
    threadItems,
  };
}

/**
 * Creates a new community post supporting text, images (max 5), and thread items.
 */
export async function createCommunityPost(
  userId: string,
  input: CreatePostInput,
): Promise<CommunityPostDto> {
  let finalContent = input.content?.trim() || "";
  let finalImages = [...(input.images || [])];

  if (input.threadItems && input.threadItems.length > 0) {
    if (!finalContent) {
      finalContent = input.threadItems
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join("\n\n");
    }
    if (finalImages.length === 0) {
      finalImages = input.threadItems.flatMap((item) =>
        item.imageUrl ? [item.imageUrl] : [],
      );
    }
  }

  // Strict enforcement of 5 images maximum
  if (finalImages.length > 5) {
    finalImages = finalImages.slice(0, 5);
  }

  const createdPost = await prisma.$transaction(async (tx) => {
    return tx.communityPost.create({
      data: {
        userId,
        content: finalContent,
        images: finalImages,
        ...(input.threadItems && input.threadItems.length > 0
          ? {
              threadItems: {
                create: input.threadItems.map((item, index) => ({
                  order: index,
                  text: item.text.trim(),
                  imageUrl: item.imageUrl || null,
                })),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            citizenProfile: { select: { fullName: true } },
            agencyProfile: { select: { agencyName: true } },
          },
        },
        threadItems: { orderBy: { order: "asc" } },
      },
    });
  });

  const author = mapCommunityAuthor(createdPost.user);
  const timeLabel = formatRelativeTime(createdPost.createdAt);

  return {
    id: createdPost.id,
    author,
    content: createdPost.content,
    images: createdPost.images,
    createdAt: createdPost.createdAt.toISOString(),
    timeLabel,
    likesCount: 0,
    likeCount: 0,
    isLiked: false,
    comments: [],
    threadItems: createdPost.threadItems.map((item) => ({
      id: item.id,
      order: item.order,
      text: item.text,
      imageUrl: item.imageUrl,
    })),
  };
}

/**
 * Soft deletes a community post. Allowed by author or admin (AGENCY).
 */
export async function deleteCommunityPost(
  postId: string,
  userId: string,
  userRole?: Role | null,
): Promise<{ success: boolean; message: string }> {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true, userId: true, deletedAt: true },
  });

  if (!post || post.deletedAt !== null) {
    return { success: false, message: "Post not found" };
  }

  const isAuthor = post.userId === userId;
  const isAdmin = userRole === Role.AGENCY;

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      message: "Forbidden: You are not authorized to delete this post",
    };
  }

  await prisma.communityPost.update({
    where: { id: postId },
    data: { deletedAt: new Date() },
  });

  return { success: true, message: "Post deleted successfully" };
}

/**
 * Toggles like status on a community post.
 */
export async function togglePostLike(
  postId: string,
  userId: string,
): Promise<{
  isLiked: boolean;
  likesCount: number;
  likeCount: number;
}> {
  const existingLike = await prisma.communityPostLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.communityPostLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.communityPostLike.create({
      data: {
        postId,
        userId,
      },
    });
  }

  const count = await prisma.communityPostLike.count({
    where: { postId },
  });

  const isLiked = !existingLike;

  return {
    isLiked,
    likesCount: count,
    likeCount: count,
  };
}

/**
 * Adds a comment or nested reply to a community post.
 */
export async function addCommunityComment(
  postId: string,
  userId: string,
  input: CreateCommentInput,
): Promise<CommunityCommentDto> {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId, deletedAt: null },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (input.parentId) {
    const parentComment = await prisma.communityComment.findFirst({
      where: {
        id: input.parentId,
        postId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!parentComment) {
      throw new Error("Parent comment not found");
    }
  }

  const newComment = await prisma.communityComment.create({
    data: {
      postId,
      userId,
      content: input.content.trim(),
      parentId: input.parentId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          citizenProfile: { select: { fullName: true } },
          agencyProfile: { select: { agencyName: true } },
        },
      },
    },
  });

  const author = mapCommunityAuthor(newComment.user);
  const timeLabel = formatRelativeTime(newComment.createdAt);

  return {
    id: newComment.id,
    postId: newComment.postId,
    author,
    content: newComment.content,
    createdAt: newComment.createdAt.toISOString(),
    timeLabel,
    likesCount: 0,
    likeCount: 0,
    isLiked: false,
    replies: [],
  };
}

/**
 * Soft deletes a community comment. Allowed by author or admin (AGENCY).
 */
export async function deleteCommunityComment(
  commentId: string,
  userId: string,
  userRole?: Role | null,
): Promise<{ success: boolean; message: string }> {
  const comment = await prisma.communityComment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, deletedAt: true },
  });

  if (!comment || comment.deletedAt !== null) {
    return { success: false, message: "Comment not found" };
  }

  const isAuthor = comment.userId === userId;
  const isAdmin = userRole === Role.AGENCY;

  if (!isAuthor && !isAdmin) {
    return {
      success: false,
      message: "Forbidden: You are not authorized to delete this comment",
    };
  }

  await prisma.communityComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  return { success: true, message: "Comment deleted successfully" };
}

/**
 * Toggles like status on a community comment.
 */
export async function toggleCommentLike(
  commentId: string,
  userId: string,
): Promise<{
  isLiked: boolean;
  likesCount: number;
  likeCount: number;
}> {
  const existingLike = await prisma.communityCommentLike.findUnique({
    where: {
      commentId_userId: {
        commentId,
        userId,
      },
    },
  });

  if (existingLike) {
    await prisma.communityCommentLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.communityCommentLike.create({
      data: {
        commentId,
        userId,
      },
    });
  }

  const count = await prisma.communityCommentLike.count({
    where: { commentId },
  });

  const isLiked = !existingLike;

  return {
    isLiked,
    likesCount: count,
    likeCount: count,
  };
}
