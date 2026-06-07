import {
  mapAdminComment,
  mapAdminCommentProject,
} from "@/lib/admin-comments/admin-comments-format";
import type {
  AdminCommentApiItem,
  AdminCommentProjectApiItem,
} from "@/lib/admin-comments/admin-comments-types";

type AdminCommentsApiResponse<T> = {
  data?: T;
};

export async function fetchAdminCommentsData() {
  const token = localStorage.getItem("livon-token");
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [commentsResponse, projectsResponse] = await Promise.all([
    fetch("/api/comments/admin", { headers }),
    fetch("/api/projects", { headers }),
  ]);

  if (!commentsResponse.ok || !projectsResponse.ok) {
    throw new Error("Failed to fetch comments data");
  }

  const [commentsResult, projectsResult] = (await Promise.all([
    commentsResponse.json(),
    projectsResponse.json(),
  ])) as [
    AdminCommentsApiResponse<AdminCommentApiItem[]>,
    AdminCommentsApiResponse<AdminCommentProjectApiItem[]>,
  ];

  return {
    comments: (commentsResult.data || []).map(mapAdminComment),
    projects: (projectsResult.data || []).map(mapAdminCommentProject),
  };
}

export async function deleteAdminComment(commentId: string) {
  const token = localStorage.getItem("livon-token");
  const response = await fetch(`/api/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete comment");
  }
}
