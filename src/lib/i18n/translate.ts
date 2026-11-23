import { messages } from "./messages";

export type Language = "id" | "en";
export type TranslationValues = Record<string, unknown>;

const patterns = Object.entries(messages)
  .filter(
    ([key]) => /\{\d+\}/.test(key) && key.replace(/\{\d+\}/g, "").length > 8,
  )
  .map(([key, entry]) => {
    const slots: string[] = [];
    const parts = key.split(/(\{\d+\})/g).map((part) => {
      if (/^\{\d+\}$/.test(part)) {
        slots.push(part.slice(1, -1));
        return "(.+?)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    return { regex: new RegExp("^" + parts.join("") + "$"), slots, entry };
  });

export function translate(
  source: string,
  language: Language,
  values?: TranslationValues,
) {
  const key = source.trim();
  const entry = messages[key];
  if (!entry && !values) {
    for (const pattern of patterns) {
      const match = key.match(pattern.regex);
      if (!match) continue;
      const captured = Object.fromEntries(
        pattern.slots.map((slot, index) => [slot, match[index + 1]]),
      );
      return pattern.entry[language].replace(
        /\{(\d+)\}/g,
        (placeholder, index) => captured[index] ?? placeholder,
      );
    }
    if (/^(Unauthorized|Forbidden)/i.test(key))
      return language === "id"
        ? "Akses ditolak. Silakan masuk dengan akun yang memiliki izin."
        : "Access denied. Please sign in with an authorized account.";
    if (
      language === "id" &&
      /^(An (?:internal server )?error|Failed to |Error fetching|Error occure)/i.test(
        key,
      )
    )
      return "Proses tidak berhasil. Silakan coba lagi.";
  }
  const translated = entry?.[language] ?? source;
  const padded = entry
    ? source.slice(0, source.indexOf(key)) +
      translated +
      source.slice(source.indexOf(key) + key.length)
    : translated;
  return values
    ? padded.replace(/\{(\d+)\}/g, (match, index) =>
        String(values[index] ?? match),
      )
    : padded;
}
