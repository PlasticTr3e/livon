import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function generateExcerpt(content: string): Promise<string> {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. Returning fallback excerpt.");
    return fallbackExcerpt(content);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Please provide a short, professional, and engaging excerpt or summary (maximum 2 sentences) for the following news article content:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error("Error generating excerpt with AI:", error);
    return fallbackExcerpt(content);
  }
}

function fallbackExcerpt(content: string): string {
  if (!content) return "";
  // Strip HTML tags if content contains HTML
  const stripped = content.replace(/(<([^>]+)>)/gi, "").trim();
  if (stripped.length <= 150) return stripped;
  return stripped.substring(0, 150) + "...";
}
