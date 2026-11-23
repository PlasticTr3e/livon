"use client";

import { useLanguage } from "@/context/LanguageContext";
import { summarizeProjectSentiment } from "@/lib/project-sentiment";

const segments = [
  { key: "positive", label: "Positive", color: "bg-green-600" },
  { key: "neutral", label: "Neutral", color: "bg-slate-400" },
  { key: "negative", label: "Negative", color: "bg-red-500" },
] as const;

export function ProjectSentimentBar({
  feedback,
}: {
  feedback: { sentimentLabel?: string | null }[];
}) {
  const { t: translateUi } = useLanguage();

  const summary = summarizeProjectSentiment(feedback);
  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#111827]"
      aria-labelledby="project-sentiment-title"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="project-sentiment-title"
          className="font-bold text-gray-900 dark:text-white"
        >
          {translateUi("Feedback sentiment")}
        </h2>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {summary.direction}
        </p>
      </div>
      <div
        role="img"
        aria-label={translateUi(
          "Feedback sentiment: {0} positive, {1} neutral, {2} negative. {3} not analyzed.",
          {
            0: summary.positive,
            1: summary.neutral,
            2: summary.negative,
            3: summary.pending,
          },
        )}
        className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      >
        {summary.analyzed > 0 &&
          segments.map(({ key, color }) => (
            <div
              key={key}
              className={color}
              style={{ width: `${(summary[key] / summary.analyzed) * 100}%` }}
            />
          ))}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-300">
        {segments.map(({ key, label, color }) => (
          <li key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${color}`}
            />
            {translateUi(label)}{" "}
            {summary.analyzed > 0
              ? Math.round((summary[key] / summary.analyzed) * 100)
              : 0}
            % ({summary[key]})
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {summary.analyzed} {translateUi(" analyzed")}{" "}
        {summary.analyzed === 1
          ? translateUi("comment")
          : translateUi("comments")}
        {summary.pending > 0
          ? translateUi(" · {0} not analyzed yet", { 0: summary.pending })
          : ""}
      </p>
    </section>
  );
}
