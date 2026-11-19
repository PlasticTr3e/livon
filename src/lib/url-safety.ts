const SAFE_HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/;

/** Allows absolute http(s) URLs and safe root-relative paths while blocking javascript:/data:/protocol-relative URLs. */
export function isSafeMediaUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || CONTROL_CHAR_REGEX.test(trimmed)) return false;

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
  }

  try {
    const parsed = new URL(trimmed);
    return SAFE_HTTP_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/** Allows absolute http(s) URLs only. */
export function isSafeHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || CONTROL_CHAR_REGEX.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return SAFE_HTTP_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/** Returns a sanitized URL for href/src attributes or null if the scheme is disallowed. */
export function sanitizeHref(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isSafeMediaUrl(trimmed) ? trimmed : null;
}

/** Returns NEXT_PUBLIC_APP_URL without trailing slashes. */
export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}
