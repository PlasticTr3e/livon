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

/** Computes sentiment counts and signed averageScore in [-1, 1] weighted by confidence. */
export function computeProjectSentimentAnalytics(
  comments: {
    sentimentLabel?: string | null;
    sentimentScore?: number | null;
  }[],
) {
  const summary = summarizeProjectSentiment(comments);
  let weightedSum = 0;

  for (const comment of comments) {
    const label = comment.sentimentLabel?.toUpperCase();
    let polarity = 0;
    if (label === "POSITIF" || label === "POSITIVE") polarity = 1;
    else if (label === "NEGATIF" || label === "NEGATIVE") polarity = -1;
    else if (label !== "NETRAL" && label !== "NEUTRAL") continue;

    if (polarity === 0) continue;

    const rawScore = comment.sentimentScore;
    const confidence =
      typeof rawScore === "number" && Number.isFinite(rawScore)
        ? Math.min(1, Math.max(0, Math.abs(rawScore)))
        : 1;
    weightedSum += polarity * confidence;
  }

  const rawAverage = summary.analyzed > 0 ? weightedSum / summary.analyzed : 0;
  const rounded = Number(rawAverage.toFixed(2));

  return {
    totalAnalyzed: summary.analyzed,
    distribution: {
      positive: summary.positive,
      negative: summary.negative,
      neutral: summary.neutral,
    },
    averageScore: Object.is(rounded, -0) ? 0 : rounded,
  };
}
