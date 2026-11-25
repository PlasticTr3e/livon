"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Badge, Card } from "@/components/ui/primitives";
import {
  getDominantSentiment,
  getProjectStatusBadgeClass,
  getProjectStatusLabel,
} from "@/lib/admin-dashboard/admin-dashboard-format";
import type { AdminDashboardProject } from "@/lib/admin-dashboard/admin-dashboard-types";

type AdminDashboardPriorityProjectsProps = {
  projects: AdminDashboardProject[];
};

export function AdminDashboardPriorityProjects({
  projects,
}: AdminDashboardPriorityProjectsProps) {
  const { t: translateUi } = useLanguage();

  return (
    <Card className="overflow-hidden rounded-2xl border-green-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1F2937]">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {translateUi("Priority Projects")}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-white">
            {translateUi(
              "Projects ranked by positive sentiment from AI analysis",
            )}
          </p>
        </div>
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:border-gray-800 dark:text-white">
              <th className="px-8 py-4">{translateUi("Project Details")}</th>
              <th className="px-4 py-4 text-center">{translateUi("Status")}</th>
              <th className="px-8 py-4 text-center">
                {translateUi("Dominant Sentiment")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {projects.length > 0 ? (
              projects.map((project) => (
                <PriorityProjectRow key={project.id} project={project} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-24 text-center text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-white"
                >
                  {translateUi("No projects meet the criteria")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function PriorityProjectRow({ project }: { project: AdminDashboardProject }) {
  const { t: translateUi } = useLanguage();

  const sentiment = getDominantSentiment(
    project.sentimentAnalytics?.distribution,
  );

  return (
    <tr className="group transition-colors hover:bg-green-50/50 dark:hover:bg-green-900/20">
      <td className="px-8 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
            {project.title}
          </span>
          <span className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white">
            {translateUi("Priority project")}
          </span>
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex justify-center">
          <Badge
            className={`rounded-full border-transparent px-4 py-1.5 text-[10px] font-semibold ${getProjectStatusBadgeClass(project.status)}`}
          >
            {translateUi(getProjectStatusLabel(project.status))}
          </Badge>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex justify-center">
          <Badge
            className={`rounded-full border-transparent px-4 py-1.5 text-[10px] font-semibold ${sentiment.color}`}
          >
            {translateUi(sentiment.label)}
            {sentiment.percentage > 0 && (
              <span className="ml-1 opacity-75">({sentiment.percentage}%)</span>
            )}
          </Badge>
        </div>
      </td>
    </tr>
  );
}
