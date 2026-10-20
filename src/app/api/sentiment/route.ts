import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, badRequest } from "@/lib/api-response";
import { RATE_LIMITS, getClientIp, rateLimit } from "@/lib/rate-limit";
import { analyzeSentiment } from "@/services/sentiment";

const sentimentSchema = z.object({
  text: z.string().min(1).max(2000),
});

/**
 * @swagger
 * /api/sentiment:
 *   post:
 *     summary: Classify the sentiment of a text
 *     description: Proxies the internal AI service so its API key never reaches the browser. Falls back to keyword analysis when the service is down.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sentiment label and confidence score
 *       400:
 *         description: Validation failed
 *       429:
 *         description: Too many requests
 */
export async function POST(req: NextRequest) {
  const limited = await rateLimit(RATE_LIMITS.sentiment, getClientIp(req));
  if (limited) return limited;

  const result = sentimentSchema.safeParse(await req.json().catch(() => null));
  if (!result.success) {
    return badRequest("Validation failed", z.treeifyError(result.error));
  }

  const sentiment = await analyzeSentiment(result.data.text);
  return ok("Sentiment analyzed", {
    data: { sentiment: sentiment.label, confidence_score: sentiment.score },
  });
}
