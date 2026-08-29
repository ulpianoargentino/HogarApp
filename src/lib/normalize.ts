/** Minúsculas y sin tildes: "Café Torrado" → "cafe torrado" (la ñ se conserva) */
export function normalizeText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, (m, offset: number, str: string) =>
      // conservar la virgulilla de la ñ
      m === '̃' && str[offset - 1] === 'n' ? m : '',
    )
    .normalize('NFC')
}

/** Slug apto para docId: "Queso cremoso" → "queso-cremoso" */
export function slugify(s: string): string {
  return normalizeText(s)
    .replace(/[^a-z0-9ñ ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}
