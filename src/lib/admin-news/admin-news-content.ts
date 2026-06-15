export function buildAdminNewsContent(hook: string, content: string) {
  return [hook.trim(), content.trim()].filter(Boolean).join("\n\n");
}

export function splitAdminNewsContent(content?: string | null) {
  const paragraphs = (content || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return {
    hook: paragraphs[0] || "",
    content: paragraphs.slice(1).join("\n\n"),
  };
}
