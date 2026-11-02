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
          Feedback sentiment
        </h2>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {summary.direction}
        </p>
      </div>
      <div
        role="img"
        aria-label={`Feedback sentiment: ${summary.positive} positive, ${summary.neutral} neutral, ${summary.negative} negative. ${summary.pending} not analyzed.`}
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
            {label}{" "}
            {summary.analyzed > 0
              ? Math.round((summary[key] / summary.analyzed) * 100)
              : 0}
            % ({summary[key]})
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {summary.analyzed} analyzed{" "}
        {summary.analyzed === 1 ? "comment" : "comments"}
        {summary.pending > 0 ? ` · ${summary.pending} not analyzed yet` : ""}
      </p>
    </section>
  );
}
