import { SentimentLabel } from "@/generated/prisma/enums";

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || "";
const AI_REQUEST_TIMEOUT_MS = 3500;

interface AIPredictResponse {
  success: boolean;
  data: {
    text_cleaned: string;
    sentiment: "POSITIF" | "NEGATIF" | "NETRAL";
    confidence_score: number;
  };
}

const SLANG_REPLACEMENTS: Record<string, string> = {
  ga: "tidak",
  gak: "tidak",
  gk: "tidak",
  nggak: "tidak",
  ngga: "tidak",
  enggak: "tidak",
  engga: "tidak",
  tdk: "tidak",
  kagak: "tidak",
  ndak: "tidak",
  tak: "tidak",
  bkn: "bukan",
  blm: "belum",
  blom: "belum",
  krg: "kurang",
  jgn: "jangan",
  tp: "tapi",
  tpi: "tapi",
  bgus: "bagus",
  bgs: "bagus",
  mntp: "mantap",
  mantul: "mantap",
  rsk: "rusak",
  prh: "parah",
  jlk: "jelek",
  mks: "terima kasih",
  makasih: "terima kasih",
  mksh: "terima kasih",
  thx: "terima kasih",
  tq: "terima kasih",
};

const NEGATION_WORDS = new Set([
  "tidak",
  "bukan",
  "belum",
  "kurang",
  "jangan",
  "tanpa",
]);

const CONTRAST_WORDS = new Set([
  "tapi",
  "tetapi",
  "namun",
  "padahal",
  "melainkan",
]);

const POSITIVE_WORDS = new Set([
  "bagus",
  "baik",
  "mantap",
  "keren",
  "setuju",
  "mendukung",
  "dukung",
  "cepat",
  "solusi",
  "dibutuhkan",
  "membantu",
  "bermanfaat",
  "alhamdulillah",
  "terima_kasih",
  "terbantu",
  "rapi",
  "bersih",
  "terang",
  "aman",
  "nyaman",
  "hebat",
  "prioritaskan",
  "mulus",
  "kokoh",
  "lancar",
  "puas",
  "senang",
  "salut",
]);

const NEGATIVE_WORDS = new Set([
  "rusak",
  "hancur",
  "lambat",
  "lamban",
  "jelek",
  "buruk",
  "kecewa",
  "mengecewakan",
  "parah",
  "bahaya",
  "berbahaya",
  "macet",
  "bolong",
  "berlubang",
  "banjir",
  "mampet",
  "mengganggu",
  "ganggu",
  "bising",
  "semrawut",
  "mubazir",
  "percuma",
  "gagal",
  "molor",
  "bocor",
  "retak",
  "kotor",
  "bau",
  "buang_anggaran",
  "buang_uang",
]);

function normalizeLocalText(text: string): string[] {
  let normalized = text
    .toLowerCase()
    .replace(/[.,!?;:\n]+/g, " __sep__ ")
    .replace(/[^\w\s]/g, " ");

  normalized = normalized
    .replace(/\bterima\s+kasih\b/g, "terima_kasih")
    .replace(/\bbuang(?:\s+buang)?\s+(?:anggaran|uang)\b/g, "buang_anggaran");

  const tokens: string[] = [];
  for (const raw of normalized.split(/\s+/)) {
    if (!raw) continue;
    if (raw === "__sep__") {
      tokens.push(raw);
      continue;
    }
    const collapsed = raw.replace(/(.)\1{2,}/g, "$1");
    const mapped = SLANG_REPLACEMENTS[collapsed] ?? collapsed;
    for (const part of mapped.split(" ")) {
      tokens.push(part);
    }
  }

  // Merge expanded "terima" + "kasih" back to the single phrase token.
  const merged: string[] = [];
  for (const tok of tokens) {
    if (tok === "kasih" && merged.at(-1) === "terima") {
      merged[merged.length - 1] = "terima_kasih";
    } else {
      merged.push(tok);
    }
  }
  return merged;
}

/** Lexicon fallback with clause-scoped negation handling and confidence in [0.5, 0.95]. */
export function analyzeSentimentLocal(text: string): {
  score: number;
  label: SentimentLabel;
} {
  const lower = text.toLowerCase();
  const isMildNeutralIdiom = /\b(b\s+aja|biasa\s+(?:aja|saja))\b/.test(lower);
  const tokens = normalizeLocalText(text);

  let net = 0;
  let negWindow = 0;

  for (const token of tokens) {
    if (token === "__sep__" || CONTRAST_WORDS.has(token)) {
      negWindow = 0;
      continue;
    }
    if (NEGATION_WORDS.has(token)) {
      negWindow = 2;
      continue;
    }

    let delta = 0;
    if (POSITIVE_WORDS.has(token)) delta = 1;
    else if (NEGATIVE_WORDS.has(token)) delta = -1;

    if (delta !== 0) {
      net += negWindow > 0 ? -delta : delta;
      negWindow = 0;
    } else if (negWindow > 0) {
      negWindow -= 1;
    }
  }

  if (isMildNeutralIdiom && net === 0) {
    return { score: 0.75, label: SentimentLabel.NETRAL };
  }

  if (net > 0) {
    return {
      score: Math.min(0.95, Number((0.6 + 0.1 * net).toFixed(4))),
      label: SentimentLabel.POSITIF,
    };
  }

  if (net < 0) {
    return {
      score: Math.min(0.95, Number((0.6 + 0.1 * Math.abs(net)).toFixed(4))),
      label: SentimentLabel.NEGATIF,
    };
  }

  return { score: 0.5, label: SentimentLabel.NETRAL };
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
        signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI service error:", response.status, errText);
        throw new Error(`AI service returned ${response.status}`);
      }

      const data: AIPredictResponse = await response.json();

      if (data?.success && data.data?.sentiment) {
        const rawScore = Number(data.data.confidence_score);
        const clampedScore = Number.isFinite(rawScore)
          ? Math.min(1, Math.max(0, rawScore))
          : 0.5;
        return {
          score: clampedScore,
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
