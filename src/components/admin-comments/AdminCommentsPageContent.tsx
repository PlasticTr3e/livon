"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminCommentsBackBar } from "@/components/admin-comments/AdminCommentsBackBar";
import { AdminCommentsDashboardView } from "@/components/admin-comments/AdminCommentsDashboardView";
import { AdminCommentsHeader } from "@/components/admin-comments/AdminCommentsHeader";
import { AdminCommentsList } from "@/components/admin-comments/AdminCommentsList";
import { useToast } from "@/components/shared/AppToaster";
import {
  deleteAdminComment,
  fetchAdminCommentsData,
} from "@/lib/admin-comments/admin-comments-api";
import {
  filterAdminComments,
  filterAndSortAdminCommentProjects,
  getAdminCommentProjectSummaries,
  getAdminCommentsInsight,
} from "@/lib/admin-comments/admin-comments-format";
import type {
  AdminCommentItem,
  AdminCommentProject,
  AdminCommentProjectSort,
  AdminCommentSelectedProject,
  AdminCommentSentimentFilter,
} from "@/lib/admin-comments/admin-comments-types";

export function AdminCommentsPageContent() {
  const toast = useToast();
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [projects, setProjects] = useState<AdminCommentProject[]>([]);
  const [selectedProject, setSelectedProject] =
    useState<AdminCommentSelectedProject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectSort, setProjectSort] =
    useState<AdminCommentProjectSort>("latest");
  const [sentimentFilter, setSentimentFilter] =
    useState<AdminCommentSentimentFilter>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCommentsData() {
      try {
        setIsLoading(true);
        const data = await fetchAdminCommentsData();

        if (!isMounted) {
          return;
        }

        setComments(data.comments);
        setProjects(data.projects);
      } catch (error) {
        console.error("Error fetching comments data:", error);
        setComments([]);
        setProjects([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCommentsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const insights = useMemo(() => getAdminCommentsInsight(comments), [comments]);
  const projectSummaries = useMemo(
    () => getAdminCommentProjectSummaries(comments, projects),
    [comments, projects],
  );
  const sortedProjects = useMemo(
    () =>
      filterAndSortAdminCommentProjects(
        projectSummaries,
        projectSearchQuery,
        projectSort,
      ),
    [projectSearchQuery, projectSort, projectSummaries],
  );
  const filteredComments = useMemo(
    () =>
      filterAdminComments(
        comments,
        selectedProject,
        searchQuery,
        sentimentFilter,
      ),
    [comments, searchQuery, selectedProject, sentimentFilter],
  );

  async function handleDeleteComment(commentId: string) {
    try {
      await deleteAdminComment(commentId);
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
      toast.success("Success", "Comment deleted.");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Delete failed", "Failed to delete comment.");
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-slate-50 dark:bg-[#0B1120]">
      {selectedProject && (
        <AdminCommentsBackBar onBack={() => setSelectedProject(null)} />
      )}

      <div className="space-y-6 p-6 md:p-8">
        <AdminCommentsHeader selectedProject={selectedProject} />

        {selectedProject ? (
          <AdminCommentsList
            isLoading={isLoading}
            comments={filteredComments}
            searchQuery={searchQuery}
            sentimentFilter={sentimentFilter}
            onSearchChange={setSearchQuery}
            onSentimentFilterChange={setSentimentFilter}
            onDeleteComment={handleDeleteComment}
          />
        ) : (
          <AdminCommentsDashboardView
            isLoading={isLoading}
            insights={insights}
            projects={sortedProjects}
            projectSearchQuery={projectSearchQuery}
            projectSort={projectSort}
            onProjectSearchChange={setProjectSearchQuery}
            onProjectSortChange={setProjectSort}
            onSelectProject={setSelectedProject}
          />
        )}
      </div>
    </div>
  );
}
