const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&quot;": "\"",
  "&#39;": "'",
  "&#x27;": "'",
};

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&(?:amp|apos|gt|lt|quot|#39|#x27);/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] || entity)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
