import { SentimentLabel } from "@/generated/prisma/enums";

export function analyzeSentiment(text: string): {
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
