/**
 * Normalizes user meal phrase for deterministic local caching.
 * Example: "  2 Eggs On Sourdough Toast! " -> "2 eggs on sourdough toast"
 */
export function normalizeMealPhrase(phrase: string): string {
  if (!phrase) return '';
  return phrase
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')   // collapse multi-spaces
    .trim();
}
