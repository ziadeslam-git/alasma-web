export function getPlainBodyParagraphs(body: string): string[] {
  if (body.includes('<')) return [];
  return body
    .split(/\r?\n[\t ]*\r?\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
