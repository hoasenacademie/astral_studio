const NON_RENSEIGNE_PATTERN = /\bnon\s+renseign(?:e|é)s?\b/gi;

export function sanitizePdfText(value?: string | null): string {
  const source = (value ?? "").replace(/\r/g, "").trim();
  if (!source) return "";

  const cleaned = source
    .replace(NON_RENSEIGNE_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;:.!?])/g, "$1")
    .trim();

  if (!cleaned) return "";
  if (/^[,;:.!?-]+$/.test(cleaned)) return "";
  return cleaned;
}

export function hasPdfText(value?: string | null): boolean {
  return sanitizePdfText(value).length > 0;
}
