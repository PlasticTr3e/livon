export function summarizeProjectSentiment(
  feedback: { sentimentLabel?: string | null }[],
) {
  const counts = { positive: 0, neutral: 0, negative: 0, pending: 0 };
  for (const item of feedback) {
    switch (item.sentimentLabel?.toUpperCase()) {
      case "POSITIF":
      case "POSITIVE":
        counts.positive++;
        break;
      case "NETRAL":
      case "NEUTRAL":
        counts.neutral++;
        break;
      case "NEGATIF":
      case "NEGATIVE":
        counts.negative++;
        break;
      default:
        counts.pending++;
    }
  }
  const analyzed = counts.positive + counts.neutral + counts.negative;
  const largest = Math.max(counts.positive, counts.neutral, counts.negative);
  const leaders = ["positive", "neutral", "negative"] as const;
  const dominant = leaders.filter((label) => counts[label] === largest);
  const direction =
    analyzed === 0
      ? "No analyzed feedback yet"
      : dominant.length !== 1
        ? "Mixed sentiment"
        : `Mostly ${dominant[0]}`;
  return { ...counts, analyzed, direction };
}
