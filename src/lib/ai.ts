import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateExcerpt(content: string): Promise<string> {
  if (!genAI || !content.trim()) {
    return content.slice(0, 120);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Buatkan ringkasan atau kutipan singkat (excerpt) maksimal 120 karakter dari teks berita berikut ini. Ringkasan harus menarik dan tanpa tambahan teks pengantar apapun (langsung ke intinya):

Teks Berita:
${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Fallback if AI generates something too long, slice it just in case
    return text.length > 150 ? text.slice(0, 147) + "..." : text;
  } catch (error) {
    console.error("AI Excerpt Generation Error:", error);
    // Fallback on error
    return content.slice(0, 120);
  }
}
