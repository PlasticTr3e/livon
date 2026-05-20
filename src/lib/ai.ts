import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateExcerpt(content: string): Promise<string> {
  const fallbackLimit = (text: string) => text.split(/\s+/).slice(0, 120).join(" ") + (text.split(/\s+/).length > 120 ? "..." : "");

  if (!genAI || !content.trim()) {
    return fallbackLimit(content);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Buatkan ringkasan atau kutipan singkat (excerpt) dari teks berita berikut ini.
Aturan:
1. Batas maksimal teks adalah 3 kalimat atau 120 kata (ambil mana yang jumlah katanya lebih banyak).
2. Gunakan nada bicara yang humanis (terasa dekat/empati) namun tetap bergaya memancing rasa penasaran pembaca (clickbait).
3. Ringkasan harus sangat menarik dan tanpa tambahan teks pengantar apapun (langsung ke intinya).

Teks Berita:
${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return fallbackLimit(text);
  } catch (error) {
    console.error("AI Excerpt Generation Error:", error);
    // Fallback on error
    return fallbackLimit(content);
  }
}
