import { SentimentLabel } from "@/generated/prisma/enums";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || "";

interface AIPredictResponse {
  success: boolean;
  data: {
    text_cleaned: string;
    sentiment: "POSITIF" | "NEGATIF" | "NETRAL";
    confidence_score: number;
  };
}

function analyzeSentimentLocal(text: string): {
  score: number;
  label: SentimentLabel;
} {
  const positiveWords = [
    "bagus",
    "mantap",
    "keren",
    "setuju",
    "mendukung",
    "cepat",
    "solusi",
    "terima kasih",
  ];
  const negativeWords = [
    "rusak",
    "hancur",
    "lambat",
    "jelek",
    "kecewa",
    "parah",
    "bahaya",
    "macet",
    "bolong",
  ];

  let score = 0;
  const words = text.toLocaleLowerCase().split(/\W+/);

  words.forEach((word) => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });

  let label: SentimentLabel = SentimentLabel.NETRAL;
  if (score > 0) label = SentimentLabel.POSITIF;
  if (score < 0) label = SentimentLabel.NEGATIF;

  return { score, label };
}

function mapSentimentLabel(
  aiLabel: "POSITIF" | "NEGATIF" | "NETRAL",
): SentimentLabel {
  switch (aiLabel) {
    case "POSITIF":
      return SentimentLabel.POSITIF;
    case "NEGATIF":
      return SentimentLabel.NEGATIF;
    case "NETRAL":
      return SentimentLabel.NETRAL;
    default:
      return SentimentLabel.NETRAL;
  }
}

export async function analyzeSentiment(text: string): Promise<{
  score: number;
  label: SentimentLabel;
}> {
  if (AI_SERVICE_URL && AI_SERVICE_API_KEY) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI service error:", response.status, errText);
        throw new Error(`AI service returned ${response.status}: ${errText}`);
      }

      const data: AIPredictResponse = await response.json();

      if (data.success) {
        return {
          score: data.data.confidence_score,
          label: mapSentimentLabel(data.data.sentiment),
        };
      }
    } catch (error) {
      console.warn(
        "AI service unavailable, falling back to local analysis:",
        error,
      );
    }
  }

  return analyzeSentimentLocal(text);
}
