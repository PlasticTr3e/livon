import type {
  CommunityComment,
  CommunityDraftItem,
  CommunityPost,
} from "./community-types";

type ApiComment = Omit<CommunityComment, "replies" | "likeCount"> & {
  likeCount?: number;
  likesCount: number;
  replies?: ApiComment[];
};

type ApiPost = Omit<CommunityPost, "comments" | "likeCount"> & {
  likeCount?: number;
  likesCount: number;
  comments: ApiComment[];
};

export type CommunityPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CommunityLikeResult = {
  isLiked: boolean;
  likesCount: number;
  likeCount?: number;
};

export class CommunityApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CommunityApiError";
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const token = localStorage.getItem("livon-token");
  if (authenticated && !token) {
    throw new CommunityApiError("Please sign in to continue.", 401);
  }
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", "Bearer " + token);
  if (typeof options.body === "string")
    headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, cache: "no-store" });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new CommunityApiError(
      "Unable to connect. Check your connection and try again.",
      0,
    );
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new CommunityApiError(
      result?.message || "Request failed. Please try again.",
      response.status,
    );
  }
  return result.data as T;
}

function englishTimeLabel(label: string): string {
  if (label === "Baru saja") return "Just now";
  const match = /^(\d+) (menit|jam|hari|minggu|bulan|tahun) lalu$/.exec(label);
  if (!match) return label;
  const units: Record<string, string> = {
    menit: "minute",
    jam: "hour",
    hari: "day",
    minggu: "week",
    bulan: "month",
    tahun: "year",
  };
  const count = Number(match[1]);
  return `${count} ${units[match[2]]}${count === 1 ? "" : "s"} ago`;
}

export function mapCommunityComment(comment: ApiComment): CommunityComment {
  return {
    ...comment,
    timeLabel: englishTimeLabel(comment.timeLabel),
    likeCount: comment.likesCount ?? comment.likeCount ?? 0,
    replies: (comment.replies ?? []).map(mapCommunityComment),
  };
}

function mediaDisplayUrl(src: string): string {
  if (typeof window === "undefined") return src;
  try {
    const url = new URL(src, window.location.origin);
    if (
      url.origin === window.location.origin &&
      url.pathname.startsWith("/media/")
    ) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    return src;
  }
  return src;
}

export function mapCommunityPost(post: ApiPost): CommunityPost {
  return {
    ...post,
    timeLabel: englishTimeLabel(post.timeLabel),
    likeCount: post.likesCount ?? post.likeCount ?? 0,
    images: post.images.map(mediaDisplayUrl),
    comments: post.comments.map(mapCommunityComment),
  };
}

export async function fetchCommunityPosts(
  search: string,
  page = 1,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    search,
    page: String(page),
    limit: "20",
  });
  const data = await request<{
    posts?: ApiPost[];
    items?: ApiPost[];
    pagination: CommunityPagination;
  }>("/api/community/posts?" + query, { signal });
  return {
    posts: (data.posts ?? data.items ?? []).map(mapCommunityPost),
    pagination: data.pagination,
  };
}

export async function fetchCommunityPost(id: string, signal?: AbortSignal) {
  const post = await request<ApiPost>(
    "/api/community/posts/" + encodeURIComponent(id),
    { signal },
  );
  return mapCommunityPost(post);
}

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const data = await request<{ url: string }>(
    "/api/upload",
    { method: "POST", body: form },
    true,
  );
  let imageUrl: URL;
  try {
    imageUrl = new URL(data.url, window.location.origin);
    if (!data.url || !["http:", "https:"].includes(imageUrl.protocol)) {
      throw new Error("Invalid image URL");
    }
  } catch {
    throw new Error("The image upload did not return a valid URL.");
  }
  return imageUrl.href;
}

export async function publishCommunityPost(items: CommunityDraftItem[]) {
  const filled = items.filter((item) => item.text.trim() || item.image);
  if (!filled[0]?.text.trim()) throw new Error("Post content cannot be empty.");
  if (filled.length > 5)
    throw new Error("You can add up to 5 sections per post.");
  if (filled.some((item) => item.text.trim().length > 5000)) {
    throw new Error("Each section can contain up to 5,000 characters.");
  }
  const uploaded = await Promise.all(
    filled.map(async (item) => {
      const imageUrl = item.imageFile
        ? await uploadImage(item.imageFile)
        : item.image && /^https?:\/\//.test(item.image)
          ? item.image
          : null;
      if (item.image && !imageUrl)
        throw new Error("Select the image again before posting.");
      return { text: item.text.trim(), imageUrl };
    }),
  );
  const post = await request<ApiPost>(
    "/api/community/posts",
    {
      method: "POST",
      body: JSON.stringify({
        images: uploaded.flatMap((item) =>
          item.imageUrl ? [item.imageUrl] : [],
        ),
        threadItems: uploaded.filter((item) => item.text),
      }),
    },
    true,
  );
  return mapCommunityPost(post);
}

export async function sendCommunityComment(
  postId: string,
  content: string,
  parentId?: string,
) {
  const comment = await request<ApiComment>(
    "/api/community/posts/" + encodeURIComponent(postId) + "/comments",
    {
      method: "POST",
      body: JSON.stringify({ content, ...(parentId ? { parentId } : {}) }),
    },
    true,
  );
  return mapCommunityComment(comment);
}

export function likeCommunityPost(id: string) {
  return request<CommunityLikeResult>(
    "/api/community/posts/" + encodeURIComponent(id) + "/like",
    { method: "POST" },
    true,
  );
}

export function likeCommunityComment(id: string) {
  return request<CommunityLikeResult>(
    "/api/community/comments/" + encodeURIComponent(id) + "/like",
    { method: "POST" },
    true,
  );
}

export function deleteCommunityPost(id: string) {
  return request<void>(
    "/api/community/posts/" + encodeURIComponent(id),
    { method: "DELETE" },
    true,
  );
}

export function deleteCommunityComment(id: string) {
  return request<void>(
    "/api/community/comments/" + encodeURIComponent(id),
    { method: "DELETE" },
    true,
  );
}
